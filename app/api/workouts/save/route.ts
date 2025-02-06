// /api/workouts/save.ts
import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workout = await request.json()
    console.log('API received workout:', workout) // Debug log

    // Create the workout record
    const savedWorkout = await prisma.workout.create({
      data: {
        userId: session.user.sub,
        type: workout.type,
        duration: String(workout.duration), // Convert number to string
        difficulty: workout.difficulty,
        targetMuscles: workout.targetMuscles,
        exercises: JSON.stringify(workout.exercises) // Store as JSON string
      }
    })

    // Create a favorite record linking the user and the newly saved workout
    const favoriteWorkout = await prisma.favoriteWorkout.create({
      data: {
        userId: session.user.sub,
        workoutId: savedWorkout.id
      }
    })

    console.log('Saved workout and favorite:', { savedWorkout, favoriteWorkout })

    return NextResponse.json(savedWorkout)
  } catch (error: any) {
    console.error('Server error:', error) // Log the actual error
    return NextResponse.json(
      { error: 'Failed to save workout', details: error.message },
      { status: 500 }
    )
  }
}
