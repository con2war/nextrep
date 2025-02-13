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
          } as any,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Raw favorites data:', JSON.stringify(favorites, null, 2));

    const workouts = favorites.map((fav) => {
      const workoutObj = fav.workout as any;
      let parsedExercises;
      try {
        parsedExercises =
          typeof workoutObj.exercises === 'string'
            ? JSON.parse(workoutObj.exercises)
            : workoutObj.exercises;
        // Normalize numeric fields if the exercises are in an array.
        if (Array.isArray(parsedExercises)) {
          parsedExercises = parsedExercises.map((ex: any) => ({
            ...ex,
            reps: Number(ex.reps) || 0,
            distance: Number(ex.distance) || 0,
            calories: Number(ex.calories) || 0,
            weight: Number(ex.weight) || 0,
          }));
        }
      } catch (error) {
        console.error('Error parsing exercises:', error);
        parsedExercises = { warmup: [], mainWorkout: [], cooldown: [] };
      }

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
          exercises: parsedExercises,
        };
      } else {
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
