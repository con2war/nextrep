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
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = session.user.sub

    // Get all completed workouts for the user
    const completedWorkouts = await prisma.completedWorkout.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      include: {
        workout: true,
      },
    })

    // Calculate all stats with error handling
    const stats: WorkoutStats = {
      totalWorkouts: completedWorkouts.length,
      currentStreak: calculateCurrentStreak(completedWorkouts),
      totalMinutes: calculateTotalMinutes(completedWorkouts),
      averageRating: (completedWorkouts.reduce((sum, workout) => 
        sum + (workout.rating || 0), 0) / completedWorkouts.length || 0).toFixed(1),
      favoriteWorkouts: await prisma.favoriteWorkout.count({ where: { userId } }),
      
      // New stats calculations
      workoutsByType: completedWorkouts.reduce((acc, workout) => ({
        ...acc,
        ...(isValidWorkoutType(workout.type) ? { [workout.type]: (acc[workout.type] || 0) + 1 } : {})
      }), {
        DAILY: 0,
        AMRAP: 0,
        EMOM: 0,
        TABATA: 0,
        'FOR TIME': 0,
      }),

      mostUsedMuscleGroups: Object.entries(
        completedWorkouts.reduce((acc, workout) => {
          workout.workout?.targetMuscles?.forEach(muscle => {
            acc[muscle] = (acc[muscle] || 0) + 1;
          });
          return acc;
        }, {} as { [key: string]: number })
      )
        .map(([muscle, count]) => ({ muscle, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),

      bestRatedWorkouts: completedWorkouts
        .filter(workout => workout.rating)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3)
        .map(workout => ({
          type: workout.type,
          rating: workout.rating || 0,
          date: formatDate(workout.completedAt),
        })),

      weeklyActivity: calculateWeeklyActivity(completedWorkouts),

      personalBests: {
        longestWorkout: findLongestWorkout(completedWorkouts),
        highestRated: findHighestRatedWorkout(completedWorkouts),
        longestStreak: findLongestStreak(completedWorkouts),
      },
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error in stats API:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error.message 
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

// Helper functions for new calculations
function calculateWeeklyActivity(workouts: CompletedWorkout[]) {
  const weeks: { [key: string]: { workouts: number; minutes: number } } = {};
  const now = new Date();
  
  // Initialize last 4 weeks
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    const weekKey = weekStart.toISOString().split('T')[0];
    weeks[weekKey] = { workouts: 0, minutes: 0 };
  }

  // Populate workout data
  workouts.forEach(workout => {
    const workoutDate = new Date(workout.completedAt);
    const weekStart = new Date(workoutDate);
    weekStart.setDate(workoutDate.getDate() - workoutDate.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (weeks[weekKey]) {
      weeks[weekKey].workouts += 1;
      if (workout.duration) {
        const [mins, secs] = workout.duration.split(':').map(Number);
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

function findLongestWorkout(workouts: CompletedWorkout[]) {
  let longest = workouts.reduce((max, workout) => {
    if (!workout.duration) return max;
    
    const [mins, secs] = workout.duration.split(':').map(Number);
    const totalMins = mins + (secs || 0) / 60;
    
    if (!max.duration || totalMins > max.durationMins) {
      return {
        duration: workout.duration,
        durationMins: totalMins,
        date: workout.completedAt,
        type: workout.type
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

function findHighestRatedWorkout(workouts: CompletedWorkout[]) {
  const highest = workouts.reduce((max, workout) => {
    if (!workout.rating) return max;
    if (!max.rating || workout.rating > max.rating) {
      return {
        rating: workout.rating,
        date: workout.completedAt,
        type: workout.type
      };
    }
    return max;
  }, { rating: 0, date: new Date(), type: '' });

  return {
    rating: highest.rating,
    date: formatDate(highest.date),
    type: highest.type
  };
}

function findLongestStreak(workouts: CompletedWorkout[]) {
  if (workouts.length === 0) return 0;

  let longestStreak = 0;
  let currentStreak = 1;
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  for (let i = 1; i < sortedWorkouts.length; i++) {
    const prevDate = new Date(sortedWorkouts[i - 1].completedAt);
    const currDate = new Date(sortedWorkouts[i].completedAt);
    
    // Check if workouts were on consecutive days
    const diffDays = Math.floor(
      (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
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