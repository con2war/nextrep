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
    
    // Structure the exercises data properly
    const exercisesData = {
      warmup: data.exercises.filter((ex: any) => ex.section === 'warmup'),
      mainWorkout: data.exercises.filter((ex: any) => ex.section === 'mainWorkout'),
      cooldown: data.exercises.filter((ex: any) => ex.section === 'cooldown')
    }

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

    // Create the workout with structured data
    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        duration: data.duration,
        type: data.type,
        exercises: exercisesData, // Store structured exercises data
        targetMuscles: data.targetMuscles || [],
        difficulty: data.difficulty || 'medium',
      },
    })

    // Add to favorites
    await prisma.favoriteWorkout.create({
      data: {
        userId: user.id,
        workoutId: workout.id,
      },
    })

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error saving workout:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 