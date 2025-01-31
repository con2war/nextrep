import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  recentWorkouts: Array<{
    date: string;
    name: string;
    duration: string;
    difficulty: string;
    targetMuscles: string[];
  }>;
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Log for debugging
    console.log('Fetching stats for user:', session.user.sub)

    // Get user's completed workouts for stats
    const completedWorkouts = await prisma.completedWorkout.findMany({
      where: {
        userId: session.user.sub,
      },
      orderBy: {
        completedAt: 'desc',
      },
    })

    // Log for debugging
    console.log('Found completed workouts:', completedWorkouts.length)

    // Get user's recent favorite workouts with full workout details
    const recentFavorites = await prisma.favoriteWorkout.findMany({
      where: {
        userId: session.user.sub,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
      include: {
        workout: true, // Include the associated workout details
      },
    })

    // Initialize stats with recent favorites
    const stats = {
      totalWorkouts: completedWorkouts.length,
      currentStreak: 0,
      totalMinutes: 0,
      averageRating: '0.0',
      favoriteWorkouts: recentFavorites.length,
      recentWorkouts: recentFavorites.map(favorite => ({
        date: formatDate(favorite.createdAt),
        name: favorite.workout.type,
        duration: favorite.workout.duration,
        difficulty: favorite.workout.difficulty,
        targetMuscles: favorite.workout.targetMuscles
      }))
    }

    // Only calculate additional stats if there are completed workouts
    if (completedWorkouts.length > 0) {
      // Calculate streak
      let currentStreak = 0
      for (let i = 0; i < completedWorkouts.length; i++) {
        const workoutDate = new Date(completedWorkouts[i].completedAt)
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - workoutDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (i === 0 && diffDays > 1) break
        if (i > 0) {
          const prevWorkoutDate = new Date(completedWorkouts[i - 1].completedAt)
          const dayDiff = Math.ceil(
            Math.abs(prevWorkoutDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (dayDiff > 1) break
        }
        currentStreak++
      }
      stats.currentStreak = currentStreak

      // Calculate total workout time
      const totalMinutes = completedWorkouts.reduce((total: number, workout) => {
        if (!workout.duration) return total
        const [minutes, seconds] = workout.duration.split(':').map(Number)
        return total + minutes + (seconds || 0) / 60
      }, 0 as number)
      stats.totalMinutes = Math.round(totalMinutes)

      // Calculate average rating
      const totalRating = completedWorkouts.reduce((sum: number, workout) => 
        sum + (workout.rating || 0), 0 as number)
      stats.averageRating = (totalRating / completedWorkouts.length).toFixed(1)

      // Get recent workouts
      stats.recentWorkouts = completedWorkouts.slice(0, 3).map((workout: CompletedWorkout) => ({
        date: formatDate(workout.completedAt),
        name: workout.type,
        duration: workout.duration || '0:00',
        difficulty: 'medium',
        targetMuscles: []
      }))
    }

    // Log final stats for debugging
    console.log('Returning stats:', stats)

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
  }
}

function formatDate(date: Date) {
  const now = new Date()
  const workoutDate = new Date(date)
  const diffTime = Math.abs(now.getTime() - workoutDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  return `${diffDays - 1} days ago`
} 