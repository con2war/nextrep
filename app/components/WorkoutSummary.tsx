"use client"

import { Share2, Save, Home } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useState } from "react";

interface Exercise {
  exercise: string;
  name?: string;
  sets?: number;
  reps?: number | string;
  weight?: number;
  duration?: string;
  rest?: string;
  notes?: string;
  type?: string;
  completed?: number;
  section?: string;
}

interface WorkoutSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
  hideActions?: boolean;
  workout: {
    name: string;
    type: "AMRAP" | "EMOM" | "TABATA" | "FOR TIME" | "DAILY";
    // For EMOM / FOR TIME / AMRAP / TABATA, exercises may be stored as a JSON string.
    exercises?: any;
    warmup?: Exercise[];
    mainWorkout?: Exercise[];
    cooldown?: Exercise[];
    targetMuscles?: string[];
    difficulty?: string;
    // Extra fields for EMOM:
    intervalTime?: number;
    roundsPerMovement?: number;
    timeCap?: number;
    // Extra fields for TABATA:
    workTime?: number;
    restTime?: number;
    rounds?: number;
  };
  duration: number; // in seconds
  completedAt: Date;
}

export default function WorkoutSummary({
  isOpen,
  onClose,
  onSave,
  onShare,
  hideActions,
  workout,
  duration,
  completedAt,
}: WorkoutSummaryProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      router.push("/api/auth/login");
      return;
    }
    setIsSaving(true);
    try {
      console.log("Raw workout prop:", workout);
      let formattedExercises;
      if (
        (workout.type === "EMOM" ||
          workout.type === "FOR TIME" ||
          workout.type === "AMRAP" ||
          workout.type === "TABATA") &&
        typeof workout.exercises === "string"
      ) {
        formattedExercises = JSON.parse(workout.exercises);
      } else {
        formattedExercises = workout.exercises;
      }

      const workoutData = {
        name: workout.name || "Daily Workout",
        type: workout.type || "DAILY",
        duration: String(duration),
        difficulty: workout.difficulty || "medium",
        targetMuscles: workout.targetMuscles || [],
        exercises: formattedExercises,
        intervalTime: workout.intervalTime,
        roundsPerMovement: workout.roundsPerMovement,
        timeCap: workout.timeCap,
        workTime: workout.workTime,
        restTime: workout.restTime,
        rounds: workout.rounds,
      };
      console.log("Final workout data:", workoutData);

      const response = await fetch("/api/workouts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workoutData),
      });
      if (!response.ok) throw new Error("Failed to save workout");
      alert("Workout saved successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-center">Workout Complete!</h2>
          </div>

          <div className="space-y-4">
            {/* Workout Details */}
            <div>
              <h3 className="font-medium text-gray-900">
                {workout.name || workout.type}
              </h3>
              <p className="text-sm text-gray-500">{workout.type} Workout</p>
              {workout.difficulty && (
                <p className="text-sm text-gray-500">Difficulty: {workout.difficulty}</p>
              )}
            </div>

            {/* TABATA Specific Details */}
            {workout.type === "TABATA" && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Tabata Details</h3>
                <p className="text-sm text-gray-500">
                  Work: {workout.workTime}s &nbsp; Rest: {workout.restTime}s
                </p>
                <p className="text-sm text-gray-500">
                  Rounds: {workout.rounds}
                </p>
              </div>
            )}

            {/* AMRAP Specific Details */}
            {workout.type === "AMRAP" && workout.timeCap && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">AMRAP Details</h3>
                <p className="text-sm text-gray-500">
                  Time Cap: {workout.timeCap} minute{workout.timeCap > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* EMOM Specific Details */}
            {workout.type === "EMOM" && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">EMOM Details</h3>
                <p className="text-sm text-gray-500">
                  Interval Time: {workout.intervalTime} seconds
                </p>
                <p className="text-sm text-gray-500">
                  Rounds per Movement: {workout.roundsPerMovement}
                </p>
                {workout.roundsPerMovement &&
                  workout.exercises &&
                  typeof workout.exercises === "string" && (
                    <p className="text-sm text-gray-500">
                      Total Rounds:{" "}
                      {workout.roundsPerMovement *
                        JSON.parse(workout.exercises).length}
                    </p>
                  )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-lg font-medium">{formatDuration(duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-lg font-medium">
                  {formatDistanceToNow(completedAt, { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Target Muscles */}
            {workout.targetMuscles && workout.targetMuscles.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Target Muscles</h3>
                <div className="flex flex-wrap gap-2">
                  {workout.targetMuscles.map((muscle, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exercises */}
            <div>
              <h3 className="font-medium mb-2">Exercises</h3>
              {["EMOM", "FOR TIME", "AMRAP", "TABATA"].includes(workout.type) ? (
                (() => {
                  let exercisesData: Exercise[] = [];
                  if (typeof workout.exercises === "string") {
                    try {
                      exercisesData = JSON.parse(workout.exercises);
                    } catch (error) {
                      console.error("Error parsing exercises JSON:", error);
                    }
                  } else if (Array.isArray(workout.exercises)) {
                    exercisesData = workout.exercises;
                  }
                  return exercisesData.length > 0 ? (
                    <ul className="space-y-2">
                      {exercisesData.map((exercise: Exercise, index: number) => (
                        <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <span className="font-medium">
                            {exercise.name || exercise.exercise}
                          </span>
                          {exercise.sets && (
                            <span className="text-gray-500">
                              {" "}
                              • {exercise.sets} sets
                            </span>
                          )}
                          {exercise.reps && (
                            <span className="text-gray-500">
                              {" "}
                              • {exercise.reps} reps
                            </span>
                          )}
                          {exercise.duration && (
                            <span className="text-gray-500">
                              {" "}
                              • {exercise.duration}
                            </span>
                          )}
                          {exercise.rest && (
                            <span className="text-gray-500">
                              {" "}
                              • Rest: {exercise.rest}
                            </span>
                          )}
                          {exercise.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              {exercise.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No exercise details available</p>
                  );
                })()
              ) : workout.type === "DAILY" ? (
                <>
                  {/* Render DAILY workout sections (warmup, mainWorkout, cooldown) if available */}
                  {workout.warmup && workout.warmup.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Warm-up</h4>
                      <ul className="space-y-2">
                        {workout.warmup.map((exercise: Exercise, index: number) => (
                          <li key={`warmup-${index}`} className="text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium">
                              {exercise.name || exercise.exercise}
                            </span>
                            {exercise.sets && (
                              <span className="text-gray-500"> • {exercise.sets} sets</span>
                            )}
                            {exercise.reps && (
                              <span className="text-gray-500"> • {exercise.reps} reps</span>
                            )}
                            {exercise.duration && (
                              <span className="text-gray-500"> • {exercise.duration}</span>
                            )}
                            {exercise.rest && (
                              <span className="text-gray-500"> • Rest: {exercise.rest}</span>
                            )}
                            {exercise.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {exercise.notes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {workout.mainWorkout && workout.mainWorkout.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Main Workout</h4>
                      <ul className="space-y-2">
                        {workout.mainWorkout.map((exercise: Exercise, index: number) => (
                          <li key={`main-${index}`} className="text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium">
                              {exercise.name || exercise.exercise}
                            </span>
                            {exercise.sets && (
                              <span className="text-gray-500"> • {exercise.sets} sets</span>
                            )}
                            {exercise.reps && (
                              <span className="text-gray-500"> • {exercise.reps} reps</span>
                            )}
                            {exercise.duration && (
                              <span className="text-gray-500"> • {exercise.duration}</span>
                            )}
                            {exercise.rest && (
                              <span className="text-gray-500"> • Rest: {exercise.rest}</span>
                            )}
                            {exercise.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {exercise.notes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {workout.cooldown && workout.cooldown.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Cool-down</h4>
                      <ul className="space-y-2">
                        {workout.cooldown.map((exercise: Exercise, index: number) => (
                          <li key={`cooldown-${index}`} className="text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium">
                              {exercise.name || exercise.exercise}
                            </span>
                            {exercise.duration && (
                              <span className="text-gray-500"> • {exercise.duration}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400">No exercise details available</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

