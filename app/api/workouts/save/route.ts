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
    console.log("API received workout:", workout);

    // Prepare the exercises field based on workout type.
    let exercisesValue: any;
    if (workout.type === "DAILY") {
      // For DAILY workouts, combine warmup, mainWorkout, and cooldown arrays.
      exercisesValue = {
        warmup: workout.warmup || [],
        mainWorkout: workout.mainWorkout || [],
        cooldown: workout.cooldown || [],
      };
    } else {
      // For other workout types, use the provided exercises field.
      if (typeof workout.exercises === "string") {
        try {
          exercisesValue = JSON.parse(workout.exercises);
        } catch (error) {
          console.error("Error parsing exercises:", error);
          exercisesValue = workout.exercises;
        }
      } else {
        exercisesValue = workout.exercises;
      }
    }

    // Create the workout record.
    const savedWorkout = await prisma.workout.create({
      data: {
        userId: session.user.sub,
        type: workout.type,
        duration: String(workout.duration),
        difficulty: workout.difficulty,
        targetMuscles: workout.targetMuscles,
        exercises: exercisesValue,
      },
    });

    // Create a favorite record linking the user and the newly saved workout.
    const favoriteWorkout = await prisma.favoriteWorkout.create({
      data: {
        userId: session.user.sub,
        workoutId: savedWorkout.id,
      },
    });

    console.log("Saved workout and favorite:", { savedWorkout, favoriteWorkout });
    return NextResponse.json(savedWorkout);
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to save workout", details: error.message },
      { status: 500 }
    );
  }
}
