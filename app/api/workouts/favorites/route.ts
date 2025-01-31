import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Workout {
  id: string;
  type: string;
  duration: string;
  difficulty: string;
  targetMuscles: string[];
  exercises: any;
}

interface FavoriteWithWorkout {
  workout: {
    id: string;
    type: string;
    duration: string;
    difficulty: string;
    targetMuscles: string[];
    exercises: any;
    createdAt: Date;
  };
  createdAt: Date;
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Log the user ID for debugging
    console.log('Fetching favorites for user:', session.user.sub)

    const favorites = await prisma.favoriteWorkout.findMany({
      where: {
        userId: session.user.sub,
      },
      include: {
        workout: {
          select: {
            id: true,
            type: true,
            duration: true,
            difficulty: true,
            targetMuscles: true,
            exercises: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Log the raw favorites data
    console.log('Raw favorites data:', JSON.stringify(favorites, null, 2))

    const workouts = favorites.map((fav: FavoriteWithWorkout) => {
      // Parse exercises if they're stored as a string
      let parsedExercises
      try {
        parsedExercises = typeof fav.workout.exercises === 'string'
          ? JSON.parse(fav.workout.exercises)
          : fav.workout.exercises
      } catch (error) {
        console.error('Error parsing exercises:', error)
        parsedExercises = []
      }

      return {
        id: fav.workout.id,
        type: fav.workout.type,
        duration: fav.workout.duration,
        difficulty: fav.workout.difficulty,
        targetMuscles: fav.workout.targetMuscles,
        exercises: parsedExercises,
        createdAt: fav.createdAt.toISOString(),
      }
    })

    // Log the processed workouts
    console.log('Processed workouts:', JSON.stringify(workouts, null, 2))

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 