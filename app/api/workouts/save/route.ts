import { getSession } from '@auth0/nextjs-auth0'
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await getSession()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await req.json()
    
    // First, ensure user exists in database
    const user = await prisma.user.upsert({
      where: {
        id: session.user.sub,
      },
      update: {}, // No updates needed
      create: {
        id: session.user.sub,
        email: session.user.email || '',
        name: session.user.name || '',
      },
    })

    // Create the workout with complete data
    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        duration: data.duration,
        type: data.type,
        exercises: data.exercises, // This will store the complete exercises object
        targetMuscles: data.targetMuscles,
        difficulty: data.difficulty,
      },
    })

    // Add to favorites
    await prisma.favoriteWorkout.create({
      data: {
        userId: user.id,
        workoutId: workout.id,
      },
    })

    // Return complete workout data
    return NextResponse.json({
      ...workout,
      exercises: data.exercises, // Include complete exercises data
      targetMuscles: data.targetMuscles,
    })
  } catch (error) {
    console.error('Error saving workout:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 