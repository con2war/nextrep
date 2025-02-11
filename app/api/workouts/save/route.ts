// app/api/workouts/save/route.ts
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

    // Prepare the exercises field based on workout type.
    let exercisesData: any;
    if (workout.type === "DAILY") {
      // For DAILY workouts, combine warmup, mainWorkout, and cooldown arrays.
      exercisesData = {
        warmup: workout.warmup || [],
        mainWorkout: workout.mainWorkout || [],
        cooldown: workout.cooldown || [],
      };
    } else {
      // For other workout types, use the provided exercises field.
      if (typeof workout.exercises === "string") {
        try {
          exercisesData = JSON.parse(workout.exercises);
        } catch (error) {
          console.error("Error parsing exercises:", error);
          exercisesData = workout.exercises;
        }
      } else {
        exercisesData = workout.exercises;
      }
    }

    console.log("Structured exercises data to save:", JSON.stringify(exercisesData, null, 2));

    // Build the data object using spread syntax.
    // Only include extra fields if they are provided (not undefined or empty).
    const data: any = {
      userId: session.user.sub,
      type: workout.type,
      name: workout.name || null,
      duration: workout.duration.toString(),
      difficulty: workout.difficulty || "medium",
      targetMuscles: workout.targetMuscles || [],
      exercises: JSON.stringify(exercisesData),
    };

    if (workout.type === "TABATA") {
      data.workTime = workout.workTime !== undefined ? Number(workout.workTime) : null;
      data.restTime = workout.restTime !== undefined ? Number(workout.restTime) : null;
      data.rounds = workout.rounds !== undefined ? Number(workout.rounds) : null;
    }

    if (workout.type === "EMOM") {
      // Only include if the client sent a valid value.
      if (workout.roundsPerMovement !== undefined && workout.roundsPerMovement !== "") {
        data.roundsPerMovement = Number(workout.roundsPerMovement);
      }
      if (workout.intervalTime !== undefined && workout.intervalTime !== "") {
        data.intervalTime = Number(workout.intervalTime);
      }
    }

    if (workout.type === "AMRAP") {
      if (workout.timeCap !== undefined && workout.timeCap !== "") {
        data.timeCap = Number(workout.timeCap);
      }
    }

    console.log("Data to be saved:", JSON.stringify(data, null, 2));

    // Create the workout record.
    const savedWorkout = await prisma.workout.create({
      data,
    });

    // Create a favorite record linking the user and the newly saved workout.
    const favoriteWorkout = await prisma.favoriteWorkout.create({
      data: {
        userId: session.user.sub,
        workoutId: savedWorkout.id,
      },
      include: {
        workout: true,
      },
    });

    console.log(
      "Successfully saved workout:",
      JSON.stringify(
        {
          ...favoriteWorkout.workout,
          exercises: JSON.parse(favoriteWorkout.workout.exercises as string),
        },
        null,
        2
      )
    );

    return NextResponse.json(favoriteWorkout.workout);
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to save workout", details: error.message },
      { status: 500 }
    );
  }
}
