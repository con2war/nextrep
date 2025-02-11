"use client";

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

export interface WorkoutSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
  hideActions?: boolean;
  workout: {
    name: string;
    type: "AMRAP" | "EMOM" | "TABATA" | "FOR TIME" | "DAILY";
    duration?: string;
    exercises?: any;
    warmup?: Exercise[];
    mainWorkout?: Exercise[];
    cooldown?: Exercise[];
    targetMuscles?: string[];
    difficulty?: string;
    intervalTime?: number;
    roundsPerMovement?: number;
    timeCap?: number;
    workTime?: number;
    restTime?: number;
    rounds?: number;
  };
  duration: number;
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [savedWorkoutData, setSavedWorkoutData] = useState<any>(null);

  const handleSave = async () => {
    if (!user) {
      window.location.href = '/api/auth/login';
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const workoutData = {
        name: workout.name,
        type: workout.type,
        exercises: workout.exercises,
        duration: duration.toString(),
        difficulty: workout.difficulty || "medium",
        targetMuscles: workout.targetMuscles || [],
        ...(workout.type === 'TABATA' && {
          workTime: workout.workTime,
          restTime: workout.restTime,
          rounds: workout.rounds,
        }),
        ...(workout.type === 'EMOM' && {
          intervalTime: workout.intervalTime,
          roundsPerMovement: workout.roundsPerMovement,
        }),
        ...(workout.type === 'AMRAP' && {
          timeCap: workout.timeCap,
        }),
        ...(workout.type === 'DAILY' && {
          warmup: workout.warmup,
          mainWorkout: workout.mainWorkout,
          cooldown: workout.cooldown,
        }),
      };

      console.log("Saving workout data:", workoutData);

      const response = await fetch('/api/workouts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });

      const savedData = await response.json();
      console.log("Saved workout response:", savedData);
      
      // Show confirmation modal with saved data
      setSavedWorkoutData(savedData);
      setShowConfirmation(true);
      setIsSaved(true);
    } catch (error) {
      console.error('Save error:', error);
      setSaveError('Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const formatDuration = (seconds: number): string => {
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
                <p className="text-sm text-gray-500">
                  Difficulty: {workout.difficulty}
                </p>
              )}
            </div>

            {/* TABATA Specific Details */}
            {workout.type === "TABATA" && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Tabata Details</h3>
                <p className="text-sm text-gray-500">
                  Work: {workout.workTime}s &nbsp; Rest: {workout.restTime}s
                </p>
                <p className="text-sm text-gray-500">Rounds: {workout.rounds}</p>
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

            {/* Default Action Buttons (only rendered when hideActions is false) */}
            {!hideActions && (
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
            )}
          </div>
        </div>
      </div>

      {showConfirmation && savedWorkoutData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Workout Saved Successfully</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {JSON.stringify(savedWorkoutData, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={() => window.location.href = '/profile'}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Profile
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


