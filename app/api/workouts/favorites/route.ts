// app/api/workouts/favorites/route.ts
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Fetching favorites for user:', session.user.sub);

    // Use Prisma to find all favoriteWorkout records for the user.
    // We include the related Workout record. To get extra fields (such as workTime, restTime, etc.)
    // we cast the select object to any.
    const favorites = await prisma.favoriteWorkout.findMany({
      where: { userId: session.user.sub },
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
            workTime: true,
            restTime: true,
            rounds: true,
            intervalTime: true,
            roundsPerMovement: true,
            timeCap: true,
          } as any, // Casting to any allows inclusion of extra fields.
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Raw favorites data:', JSON.stringify(favorites, null, 2));

    // Process each favorite so that the workout object is returned directly
    // (with extra fields, and with exercises parsed).
    const workouts = favorites.map((fav) => {
      // The related workout is in fav.workout; cast it to any.
      const workoutObj = fav.workout as any;
      let parsedExercises;
      try {
        // If exercises are stored as a string, parse them.
        parsedExercises =
          typeof workoutObj.exercises === 'string'
            ? JSON.parse(workoutObj.exercises)
            : workoutObj.exercises;
      } catch (error) {
        console.error('Error parsing exercises:', error);
        // Fallback to an empty structured object.
        parsedExercises = { warmup: [], mainWorkout: [], cooldown: [] };
      }

      // Build a base workout object that includes the extra fields.
      const baseWorkout = {
        id: workoutObj.id,
        type: workoutObj.type,
        duration: workoutObj.duration,
        difficulty: workoutObj.difficulty,
        targetMuscles: workoutObj.targetMuscles,
        createdAt: workoutObj.createdAt.toISOString(),
        workTime: workoutObj.workTime,
        restTime: workoutObj.restTime,
        rounds: workoutObj.rounds,
        intervalTime: workoutObj.intervalTime,
        roundsPerMovement: workoutObj.roundsPerMovement,
        timeCap: workoutObj.timeCap,
      };

      // For DAILY workouts, unpack the structured exercises object.
      if (
        workoutObj.type === 'DAILY' &&
        parsedExercises &&
        typeof parsedExercises === 'object'
      ) {
        return {
          ...baseWorkout,
          warmup: parsedExercises.warmup || [],
          mainWorkout: parsedExercises.mainWorkout || [],
          cooldown: parsedExercises.cooldown || [],
          // Also include the full combined exercises object.
          exercises: parsedExercises,
        };
      } else {
        // For non-DAILY workouts, return the parsed exercises directly.
        return {
          ...baseWorkout,
          exercises: parsedExercises,
        };
      }
    });

    console.log('Processed workouts:', JSON.stringify(workouts, null, 2));
    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
