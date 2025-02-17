import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Initialize Prisma Client
const prisma = new PrismaClient()

// Add this export to mark the route as dynamic
export const dynamic = 'force-dynamic'

interface CompletedWorkout {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  duration: string | null;
  type: string;
  rating: number | null;
  completedAt: Date;
}

interface WorkoutStats {
  totalWorkouts: number;
  currentStreak: number;
  totalMinutes: number;
  averageRating: string;
  favoriteWorkouts: number;
  workoutsByType: {
    DAILY: number;
    AMRAP: number;
    EMOM: number;
    TABATA: number;
    'FOR TIME': number;
  };
  mostUsedMuscleGroups: Array<{
    muscle: string;
    count: number;
  }>;
  bestRatedWorkouts: Array<{
    type: string;
    rating: number;
    date: string;
  }>;
  weeklyActivity: Array<{
    week: string;
    workouts: number;
    minutes: number;
  }>;
  personalBests: {
    longestWorkout: {
      duration: string;
      date: string;
      type: string;
    };
    highestRated: {
      rating: number;
      date: string;
      type: string;
    };
    longestStreak: number;
  };
}

// Add these helper functions before the GET handler
function calculateCurrentStreak(workouts: CompletedWorkout[]): number {
  if (workouts.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  for (let i = 0; i < sortedWorkouts.length; i++) {
    const workoutDate = new Date(sortedWorkouts[i].completedAt);
    if (i === 0) {
      const diffDays = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) break;
    } else {
      const prevDate = new Date(sortedWorkouts[i - 1].completedAt);
      const diffDays = Math.floor((prevDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) break;
    }
    streak++;
  }
  return streak;
}

function calculateTotalMinutes(workouts: CompletedWorkout[]): number {
  return workouts.reduce((total, workout) => {
    if (!workout.duration) return total;
    const [minutes, seconds] = workout.duration.split(':').map(Number);
    return total + minutes + (seconds || 0) / 60;
  }, 0);
}

export async function GET() {
  try {
    const session = await getSession()
    console.log("Session:", session)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = session.user.sub
    console.log("Querying for userId:", userId)

    // Get favorite workouts with full workout details
    const favoriteWorkouts = await prisma.favoriteWorkout.findMany({
      where: { userId },
      include: {
        workout: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    console.log("Found favorite workouts:", favoriteWorkouts.length)

    // Calculate total minutes properly from seconds
    const totalMinutes = favoriteWorkouts.reduce((total, fav) => {
      if (!fav.workout?.duration) return total;
      
      // If duration is in seconds (number string)
      const seconds = parseInt(fav.workout.duration);
      if (!isNaN(seconds)) {
        return total + (seconds / 60); // Convert seconds to minutes
      }
      
      // If duration is in "MM:SS" format
      const [mins, secs] = fav.workout.duration.split(':').map(Number);
      if (!isNaN(mins) && !isNaN(secs)) {
        return total + mins + (secs / 60);
      }
      
      return total;
    }, 0);

    // Calculate stats from favorite workouts
    const stats: WorkoutStats = {
      totalWorkouts: favoriteWorkouts.length,
      currentStreak: 0, // We'll keep this at 0 since it's not applicable for favorites
      totalMinutes: Math.round(totalMinutes), // Round to nearest minute
      averageRating: "N/A", // Ratings are for completed workouts
      favoriteWorkouts: favoriteWorkouts.length,
      
      // Workout type distribution
      workoutsByType: favoriteWorkouts.reduce((acc, fav) => {
        const type = fav.workout?.type || 'UNKNOWN';
        if (isValidWorkoutType(type)) {
          return { ...acc, [type]: (acc[type] || 0) + 1 };
        }
        return acc;
      }, {
        DAILY: 0,
        AMRAP: 0,
        EMOM: 0,
        TABATA: 0,
        'FOR TIME': 0,
      }),

      // Most used muscle groups from favorites
      mostUsedMuscleGroups: Object.entries(
        favoriteWorkouts.reduce((acc, fav) => {
          fav.workout?.targetMuscles?.forEach(muscle => {
            acc[muscle] = (acc[muscle] || 0) + 1;
          });
          return acc;
        }, {} as { [key: string]: number })
      )
        .map(([muscle, count]) => ({ muscle, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),

      // We'll adapt these for favorites context
      bestRatedWorkouts: [], // Not applicable for favorites
      weeklyActivity: calculateWeeklyActivityFromFavorites(favoriteWorkouts),

      personalBests: {
        longestWorkout: findLongestWorkoutFromFavorites(favoriteWorkouts),
        highestRated: { rating: 0, date: '', type: '' }, // Not applicable
        longestStreak: 0, // Not applicable
      },
    }

    console.log("Final calculated stats:", stats)
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error in stats API:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error.message,
      stack: error.stack // Adding stack trace for debugging
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function for weekly activity from favorites
function calculateWeeklyActivityFromFavorites(favorites: any[]) {
  const weeks: { [key: string]: { workouts: number; minutes: number } } = {};
  const now = new Date();
  
  // Initialize last 4 weeks
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    const weekKey = weekStart.toISOString().split('T')[0];
    weeks[weekKey] = { workouts: 0, minutes: 0 };
  }

  // Populate favorite workout data
  favorites.forEach(fav => {
    const favDate = new Date(fav.createdAt);
    const weekStart = new Date(favDate);
    weekStart.setDate(favDate.getDate() - favDate.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (weeks[weekKey]) {
      weeks[weekKey].workouts += 1;
      if (fav.workout?.duration) {
        const [mins, secs] = fav.workout.duration.split(':').map(Number);
        weeks[weekKey].minutes += mins + (secs || 0) / 60;
      }
    }
  });

  return Object.entries(weeks).map(([week, data]) => ({
    week,
    workouts: data.workouts,
    minutes: Math.round(data.minutes)
  })).reverse();
}

function findLongestWorkoutFromFavorites(favorites: any[]) {
  const longest = favorites.reduce((max, fav) => {
    if (!fav.workout?.duration) return max;
    
    const [mins, secs] = fav.workout.duration.split(':').map(Number);
    const totalMins = mins + (secs || 0) / 60;
    
    if (!max.duration || totalMins > max.durationMins) {
      return {
        duration: fav.workout.duration,
        durationMins: totalMins,
        date: fav.createdAt,
        type: fav.workout.type
      };
    }
    return max;
  }, { duration: '', durationMins: 0, date: new Date(), type: '' });

  return {
    duration: longest.duration,
    date: formatDate(longest.date),
    type: longest.type
  };
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

type WorkoutType = 'DAILY' | 'AMRAP' | 'EMOM' | 'TABATA' | 'FOR TIME';
const isValidWorkoutType = (type: string): type is WorkoutType => {
  return ['DAILY', 'AMRAP', 'EMOM', 'TABATA', 'FOR TIME'].includes(type);
}; 