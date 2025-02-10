import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workout = await request.json();
    console.log("Raw workout data received:", JSON.stringify(workout, null, 2));

    // For DAILY workouts, create a properly structured exercises object
    let exercisesData;
    if (workout.type === "DAILY") {
      // First, try to get exercises from direct properties
      const warmup = workout.warmup || [];
      const mainWorkout = workout.mainWorkout || [];
      const cooldown = workout.cooldown || [];

      // Create the structured data
      exercisesData = {
        warmup: warmup.map((ex: any) => ({
          exercise: ex.exercise,
          duration: ex.duration,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
          type: ex.type,
          weight: ex.weight
        })),
        mainWorkout: mainWorkout.map((ex: any) => ({
          exercise: ex.exercise,
          duration: ex.duration,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
          type: ex.type,
          weight: ex.weight
        })),
        cooldown: cooldown.map((ex: any) => ({
          exercise: ex.exercise,
          duration: ex.duration,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
          type: ex.type,
          weight: ex.weight
        }))
      };
    } else {
      exercisesData = workout.exercises;
    }

    console.log("Structured exercises data to save:", JSON.stringify(exercisesData, null, 2));

    // Save the workout with the structured data
    const savedWorkout = await prisma.workout.create({
      data: {
        userId: session.user.sub,
        type: workout.type,
        duration: workout.duration || "0",
        difficulty: workout.difficulty || "medium",
        targetMuscles: workout.targetMuscles || [],
        exercises: JSON.stringify(exercisesData), // Explicitly stringify the exercises data
      },
    });

    // Create a favorite record with the workout included in the response
    const favoriteWorkout = await prisma.favoriteWorkout.create({
      data: {
        userId: session.user.sub,
        workoutId: savedWorkout.id,
      },
      include: {
        workout: true,
      },
    });

    // Log the saved data for verification
    console.log("Successfully saved workout:", JSON.stringify({
      ...favoriteWorkout.workout,
      exercises: JSON.parse(favoriteWorkout.workout.exercises as string)
    }, null, 2));

    return NextResponse.json(favoriteWorkout.workout);
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to save workout", details: error.message },
      { status: 500 }
    );
  }
}
