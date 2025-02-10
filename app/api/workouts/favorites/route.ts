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
        workout: true
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Raw favorites data:', JSON.stringify(favorites, null, 2));

    const workouts = favorites.map((fav) => {
      let exercisesData;
      
      try {
        // Parse exercises if it's a string
        exercisesData = typeof fav.workout.exercises === 'string' 
          ? JSON.parse(fav.workout.exercises)
          : fav.workout.exercises;
      } catch (error) {
        console.error('Error parsing exercises:', error);
        exercisesData = { warmup: [], mainWorkout: [], cooldown: [] };
      }

      // For DAILY workouts
      if (fav.workout.type === 'DAILY') {
        return {
          id: fav.workout.id,
          type: fav.workout.type,
          duration: fav.workout.duration,
          difficulty: fav.workout.difficulty,
          targetMuscles: fav.workout.targetMuscles,
          createdAt: fav.workout.createdAt.toISOString(),
          // Set both top-level arrays and nested exercises
          warmup: exercisesData.warmup || [],
          mainWorkout: exercisesData.mainWorkout || [],
          cooldown: exercisesData.cooldown || [],
          exercises: {
            warmup: exercisesData.warmup || [],
            mainWorkout: exercisesData.mainWorkout || [],
            cooldown: exercisesData.cooldown || []
          }
        };
      }

      // For non-DAILY workouts
      return {
        id: fav.workout.id,
        type: fav.workout.type,
        duration: fav.workout.duration,
        difficulty: fav.workout.difficulty,
        targetMuscles: fav.workout.targetMuscles,
        exercises: exercisesData,
        createdAt: fav.workout.createdAt.toISOString(),
      };
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

