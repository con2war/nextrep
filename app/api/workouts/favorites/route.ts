import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Raw favorites data:', JSON.stringify(favorites, null, 2));

    const workouts = favorites.map((fav: FavoriteWithWorkout) => {
      let parsedExercises;
      try {
        parsedExercises =
          typeof fav.workout.exercises === 'string'
            ? JSON.parse(fav.workout.exercises)
            : fav.workout.exercises;
      } catch (error) {
        console.error('Error parsing exercises:', error);
        parsedExercises = {};
      }

      // For DAILY workouts, unpack the exercises object.
      if (fav.workout.type === 'DAILY' && parsedExercises && typeof parsedExercises === 'object') {
        return {
          id: fav.workout.id,
          type: fav.workout.type,
          duration: fav.workout.duration,
          difficulty: fav.workout.difficulty,
          targetMuscles: fav.workout.targetMuscles,
          warmup: parsedExercises.warmup || [],
          mainWorkout: parsedExercises.mainWorkout || [],
          cooldown: parsedExercises.cooldown || [],
          // Also include the full combined object (if needed)
          exercises: parsedExercises,
          createdAt: fav.workout.createdAt.toISOString(),
        };
      } else {
        return {
          id: fav.workout.id,
          type: fav.workout.type,
          duration: fav.workout.duration,
          difficulty: fav.workout.difficulty,
          targetMuscles: fav.workout.targetMuscles,
          exercises: parsedExercises,
          createdAt: fav.workout.createdAt.toISOString(),
        };
      }
    });

    console.log('Processed workouts:', JSON.stringify(workouts, null, 2));
    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

