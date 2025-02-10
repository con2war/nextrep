"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  X,
  Plus,
  Minus,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import WorkoutSummary from "@/app/components/WorkoutSummary";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";

interface Exercise {
  exercise: string;
  name?: string;
  sets?: number;
  reps?: string | number;
  duration?: string;
  rest?: string;
  notes?: string;
  type?: string;
  completed?: number;
  weight?: number;
}

interface WorkoutData {
  name?: string;
  warmup: Exercise[];
  mainWorkout: Exercise[];
  cooldown: Exercise[];
  duration: string;
  difficulty: string;
  targetMuscles: string[];
  type: string;
  timePerExercise?: number;
  // When saved, DAILY workouts may include a combined "exercises" property.
  exercises?: {
    warmup: Exercise[];
    mainWorkout: Exercise[];
    cooldown: Exercise[];
  };
}

type ExerciseSection = "warmup" | "mainWorkout" | "cooldown";

interface ExercisesState {
  warmup: Exercise[];
  mainWorkout: Exercise[];
  cooldown: Exercise[];
}

export default function WorkoutSession({
  workout,
  onComplete,
}: {
  workout: WorkoutData;
  onComplete: (summary: any) => void;
}) {
  const router = useRouter();
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Initialize exercises state from the workout prop.
  const [exercises, setExercises] = useState<ExercisesState>(() => {
    // Use the provided workout object (or its "exercises" property) if available.
    const workoutExercises = workout.exercises || workout;
    return {
      warmup: (workoutExercises.warmup || []).map((ex: Exercise) => ({
        ...ex,
        completed: ex.completed || 0,
        weight: ex.weight || 0,
      })),
      mainWorkout: (workoutExercises.mainWorkout || []).map((ex: Exercise) => ({
        ...ex,
        completed: ex.completed || 0,
        weight: ex.weight || 0,
      })),
      cooldown: (workoutExercises.cooldown || []).map((ex: Exercise) => ({
        ...ex,
        completed: ex.completed || 0,
        weight: ex.weight || 0,
      })),
    };
  });

  // Timer effect.
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (isRunning && !isPaused) {
      timerId = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRunning, isPaused]);

  // Load the saved workout from localStorage on mount.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("selectedWorkout");
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout);
      console.log("WorkoutSession parsedWorkout:", parsedWorkout);
      // If there's an "exercises" property, use it.
      if (parsedWorkout.exercises) {
        setExercises(parsedWorkout.exercises);
      }
      // Otherwise, if the top-level keys exist, combine them.
      else if (
        parsedWorkout.warmup ||
        parsedWorkout.mainWorkout ||
        parsedWorkout.cooldown
      ) {
        setExercises({
          warmup: parsedWorkout.warmup || [],
          mainWorkout: parsedWorkout.mainWorkout || [],
          cooldown: parsedWorkout.cooldown || [],
        });
      } else {
        console.warn("No exercises property in parsedWorkout!");
      }
      setTimer(parsedWorkout.timePerExercise || 0);
    } else {
      router.push("/daily-workout");
    }
  }, [router]);

  console.log("Exercises state in WorkoutSession:", exercises);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSetComplete = (section: ExerciseSection, exerciseIndex: number) => {
    setExercises((prev) => ({
      ...prev,
      [section]: prev[section].map((ex, i) => {
        if (i === exerciseIndex && (ex.completed || 0) < (ex.sets || 0)) {
          return {
            ...ex,
            completed: (ex.completed || 0) + 1,
          };
        }
        return ex;
      }),
    }));
  };

  const handleWeightChange = (
    section: ExerciseSection,
    exerciseIndex: number,
    change: number
  ) => {
    setExercises((prev) => ({
      ...prev,
      [section]: prev[section].map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, weight: Math.max(0, (ex.weight || 0) + change) }
          : ex
      ),
    }));
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          voices = window.speechSynthesis.getVoices();
        });
      }
      const preferredVoice = voices.find(
        (voice) =>
          (voice.name.includes("Male") ||
            voice.name.includes("Daniel") ||
            voice.name.includes("David") ||
            voice.name.includes("James")) &&
          (voice.lang.includes("en-US") || voice.lang.includes("en-GB"))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.pitch = 1.1;
      utterance.rate = 1.2;
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleComplete = () => {
    setIsRunning(false);
    setCompletedAt(new Date());
    speak("Well Done");
    setShowSummary(true);
  };

  const handleSave = async () => {
    console.log("Saving workout...");
    setShowSummary(false);
    console.log("Exercises state in WorkoutSession:", exercises);
    onComplete({
      duration: formatTime(timer),
      exercises: {
        warmup: exercises.warmup,
        mainWorkout: exercises.mainWorkout,
        cooldown: exercises.cooldown,
      },
      completedAt: completedAt,
    });
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: workout.name || "Daily Workout",
        text: `I completed my daily workout in ${formatTime(timer)}!`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        alert("Workout details copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
    setShowSummary(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="NextRep AI Logo"
              width={64}
              height={64}
              className="h-12 w-auto"
            />
          </div>
          <button
            onClick={() => {
              setCompletedAt(new Date());
              setShowSummary(true);
              speak("Well Done");
            }}
            className="text-gray-600 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <span>End Workout</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold mb-4">
            {showCountdown ? (
              <WorkoutCountdown
                onComplete={() => {
                  setShowCountdown(false);
                  setIsRunning(true);
                  setIsPaused(false);
                  speak("Let's Go");
                }}
                onStart={() => {
                  setIsRunning(false);
                  setIsPaused(false);
                }}
              />
            ) : (
              formatTime(timer)
            )}
          </div>
          <div className="flex justify-center gap-4 items-center">
            <button
              onClick={() => {
                if (!isRunning && !isPaused) {
                  setShowCountdown(true);
                } else {
                  setIsRunning(!isRunning);
                  setIsPaused(!isPaused);
                }
              }}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {isPaused ? "Resume" : "Start"}
                </>
              )}
            </button>
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-3 rounded-lg ${isAudioEnabled
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
                } text-white transition-colors`}
            >
              {isAudioEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Exercise Sections */}
        <div className="space-y-8">
          {Object.entries(exercises).map(([section, sectionExercises]) => (
            <section key={section}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {section.replace(/([A-Z])/g, " $1").trim()}
              </h3>
              <div className="space-y-4">
                {sectionExercises.map((exercise: Exercise, index: number) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4>{exercise.name || exercise.exercise || "Unnamed"}</h4>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {exercise.sets && (
                              <span className="text-sm text-gray-600">
                                {exercise.sets} sets
                              </span>
                            )}
                            {exercise.reps && (
                              <span className="text-sm text-gray-600">
                                {exercise.reps} reps
                              </span>
                            )}
                            {exercise.duration && (
                              <span className="text-sm text-gray-600">
                                {exercise.duration}
                              </span>
                            )}
                            {exercise.rest && (
                              <span className="text-sm text-gray-600">
                                Rest: {exercise.rest}
                              </span>
                            )}
                          </div>
                          {exercise.notes && (
                            <p className="text-sm text-gray-500 mt-2">
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {exercise.sets && (
                            <span
                              className={`text-sm font-medium ${exercise.completed === exercise.sets
                                  ? "text-green-600"
                                  : "text-blue-600"
                                }`}
                            >
                              {exercise.completed || 0}/{exercise.sets}
                            </span>
                          )}
                          <button
                            onClick={() =>
                              handleSetComplete(
                                section as ExerciseSection,
                                index
                              )
                            }
                            className={`p-2 rounded-full transition-colors ${exercise.completed === exercise.sets
                                ? "hover:bg-green-50"
                                : "hover:bg-blue-50"
                              }`}
                          >
                            <CheckCircle
                              className={`w-5 h-5 ${exercise.completed === exercise.sets
                                  ? "text-green-500 fill-green-500"
                                  : "text-gray-400"
                                }`}
                            />
                          </button>
                        </div>
                      </div>
                      {exercise.type !== "bodyweight" && (
                        <div className="flex items-center gap-2 mt-3 bg-gray-50 rounded-lg p-2">
                          <button
                            onClick={() =>
                              handleWeightChange(
                                section as ExerciseSection,
                                index,
                                -2.5
                              )
                            }
                            className="p-1.5 rounded-md hover:bg-white transition-colors text-gray-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-900 min-w-[50px] text-center">
                            {exercise.weight}kg
                          </span>
                          <button
                            onClick={() =>
                              handleWeightChange(
                                section as ExerciseSection,
                                index,
                                2.5
                              )
                            }
                            className="p-1.5 rounded-md hover:bg-white transition-colors text-gray-600"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Workout Summary Modal */}
        <WorkoutSummary
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          onSave={handleSave}
          onShare={handleShare}
          workout={{
            name: workout.name || "Daily Workout",
            type: "DAILY",
            exercises: {
              warmup: exercises.warmup,
              mainWorkout: exercises.mainWorkout,
              cooldown: exercises.cooldown
            },
            warmup: exercises.warmup,
            mainWorkout: exercises.mainWorkout,
            cooldown: exercises.cooldown,
            difficulty: workout.difficulty || "medium",
            targetMuscles: workout.targetMuscles || []
          }}
          duration={timer}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  );
}

