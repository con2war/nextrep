"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";
import WorkoutSummary from "@/app/components/WorkoutSummary";
import { formatDistanceToNow } from "date-fns";

// Helper function to format seconds as mm:ss.
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

interface Exercise {
  id: string;
  name: string;
  reps?: number;
  weight?: number;
  distance?: number;
  calories?: number;
  notes?: string;
  metric: "reps" | "distance" | "calories";
}

interface EmomWorkout {
  name: string;
  intervalTime: number;
  intervalUnit: "seconds" | "minutes";
  roundsPerMovement: number;
  exercises: Exercise[]; // Could be saved as a JSON string.
  difficulty?: string;
  targetMuscles?: string[];
}

// Helper function: parse and normalize exercises data.
const normalizeExercises = (exercisesInput: any): Exercise[] => {
  let exercisesData: any[] = [];
  if (typeof exercisesInput === "string") {
    try {
      exercisesData = JSON.parse(exercisesInput);
    } catch (error) {
      console.error("Error parsing exercises JSON:", error);
    }
  } else if (Array.isArray(exercisesInput)) {
    exercisesData = exercisesInput;
  }
  return exercisesData.map((ex) => ({
    ...ex,
    reps: Number(ex.reps) || 0,
    distance: Number(ex.distance) || 0,
    calories: Number(ex.calories) || 0,
    weight: Number(ex.weight) || 0,
  }));
};

export default function EmomSession() {
  const router = useRouter();
  const [workout, setWorkout] = useState<EmomWorkout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null);

  // --- Keep screen awake using Wake Lock API ---
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          console.log("Wake lock acquired");
        } catch (err) {
          console.error("Failed to acquire wake lock:", err);
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          console.log("Wake lock released");
          wakeLock = null;
        });
      }
    };
  }, []);
  // --- End Wake Lock API ---

  // Initialize beep sound on mount.
  useEffect(() => {
    const audio = new Audio("/beep.mp3");
    audio.volume = 0.5;
    audio.preload = "auto";
    try {
      audio.load();
      setBeepSound(audio);
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  }, []);

  // Helper: Always speak if available.
  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Helper: Always play beep.
  const beep = () => {
    if (beepSound) {
      beepSound.currentTime = 0;
      const playPromise = beepSound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing beep:", error);
          setTimeout(() => {
            beepSound.play().catch((e) => console.error("Retry error:", e));
          }, 100);
        });
      }
    }
  };

  // Load and normalize the EMOM workout from localStorage.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentEmomWorkout");
    if (savedWorkout) {
      let parsed = JSON.parse(savedWorkout) as EmomWorkout;
      // Normalize the exercises field.
      parsed.exercises = normalizeExercises(parsed.exercises);
      // Set defaults if necessary.
      if (!parsed.intervalTime) {
        parsed.intervalTime = 30; // default 30 seconds
      }
      if (!parsed.roundsPerMovement) {
        parsed.roundsPerMovement = 1; // default 1 round per movement
      }
      setWorkout(parsed);
      setTimeRemaining(parsed.intervalTime);
    } else {
      router.push("/custom-workout/emom");
    }
  }, [router]);

  // Timer effect: decrease timeRemaining every second.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && workout) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          // At halfway through the interval, speak "Halfway".
          if (newTime === Math.floor(workout.intervalTime / 2)) {
            speak("Halfway");
          }
          // When 3 seconds remain, play the beep.
          if (newTime === 3) {
            beep();
          }
          const totalRounds = workout.roundsPerMovement * workout.exercises.length;
          if (newTime <= 0) {
            if (currentRound >= totalRounds) {
              handleComplete();
              return 0;
            } else {
              setCurrentRound(currentRound + 1);
              const nextIdx = (currentExercise + 1) % workout.exercises.length;
              setCurrentExercise(nextIdx);
              speak(`Next up: ${workout.exercises[nextIdx].name}`);
              return workout.intervalTime;
            }
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, workout, currentRound, currentExercise, speak]);

  // Start/resume/pause the workout.
  const startOrToggleWorkout = () => {
    if (!isRunning && !isPaused) {
      setShowCountdown(true);
    } else if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
    } else {
      setIsRunning(false);
      setIsPaused(true);
    }
  };

  // Callback when countdown completes.
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setIsRunning(true);
    setIsPaused(false);
    speak("Let's Go");
  };

  // End workout: stop timer, cancel speech, record completion, show summary.
  const handleComplete = () => {
    setIsRunning(false);
    setIsPaused(true);
    window.speechSynthesis.cancel();
    setCompletedAt(new Date());
    speak("Well Done");
    setShowSummary(true);
  };

  // When the user clicks "Start Workout" in the summary modal.
  const handleStartWorkout = () => {
    if (!workout) return;
    localStorage.setItem("selectedWorkout", JSON.stringify(workout));
    router.push("/custom-workout/emom/session");
  };

  if (!workout) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/custom-workout/emom"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => localStorage.removeItem("currentEmomWorkout")}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Exit Workout
          </Link>
          <button
            onClick={handleComplete}
            className="flex items-center text-red-500 hover:text-red-600 transition-colors"
          >
            <span>End Workout</span>
            <X className="w-5 h-5 ml-1" />
          </button>
        </div>

        {/* Workout Name */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold">{workout.name || "EMOM Workout"}</h1>
        </div>

        {/* Timer & Round Info */}
        <div className="text-center mb-8">
          <div
            className={`text-6xl font-mono font-bold mb-4 ${timeRemaining <= 3 ? "text-red-500" : ""}`}
          >
            {showCountdown ? (
              <WorkoutCountdown
                onComplete={handleCountdownComplete}
                onStart={() => {
                  setIsRunning(false);
                  setIsPaused(false);
                }}
              />
            ) : (
              formatTime(timeRemaining)
            )}
          </div>
          <div className="text-lg font-medium text-gray-600 mb-4">
            Round {currentRound} of {workout.roundsPerMovement * workout.exercises.length}
          </div>
          <div className="flex justify-center gap-4 items-center">
            <button
              onClick={startOrToggleWorkout}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
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
          </div>
        </div>

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Every {workout.intervalTime} seconds for {workout.roundsPerMovement} set
            {workout.roundsPerMovement > 1 ? "s" : ""}:
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id}>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {exercise.metric === "reps" && exercise.reps !== undefined
                    ? `${exercise.reps} reps`
                    : exercise.metric === "distance" && exercise.distance !== undefined
                    ? `${exercise.distance} m`
                    : exercise.metric === "calories" && exercise.calories !== undefined
                    ? `${exercise.calories} cals`
                    : ""}
                  {exercise.weight !== undefined && exercise.weight !== 0
                    ? ` (Weight: ${exercise.weight} kg)`
                    : ""}
                </p>
                {exercise.notes && (
                  <p className="text-sm text-gray-400">{exercise.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workout Summary Modal */}
        {showSummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <WorkoutSummary
                  isOpen={true}
                  onClose={() => setShowSummary(false)}
                  onSave={() => {}}
                  onShare={() => {}}
                  workout={{
                    name: workout.name,
                    type: "EMOM",
                    exercises: workout.exercises,
                    difficulty: workout.difficulty,
                    targetMuscles: workout.targetMuscles,
                    intervalTime: workout.intervalTime,
                    roundsPerMovement: workout.roundsPerMovement,
                  }}
                  duration={timeRemaining}
                  completedAt={completedAt || new Date()}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
