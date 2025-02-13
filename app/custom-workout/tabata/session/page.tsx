"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkoutSummary from "@/app/components/WorkoutSummary";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";
import { formatDistanceToNow } from "date-fns";

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

interface TabataWorkout {
  name: string;
  rounds: number; // number of rounds (each round applies to each exercise)
  workTime: number; // seconds for work period
  restTime: number; // seconds for rest period
  exercises: Exercise[];
  difficulty?: string;
  targetMuscles?: string[];
}

export default function TabataSession() {
  const router = useRouter();
  const [workout, setWorkout] = useState<TabataWorkout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isWorkInterval, setIsWorkInterval] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null);
  // State to ensure "Halfway" is only spoken once per interval.
  const [hasSpokenHalfway, setHasSpokenHalfway] = useState(false);

  // Keep the screen awake using the Wake Lock API.
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          console.log("Wake lock acquired");
          wakeLock.addEventListener("release", () => {
            console.log("Wake lock was released");
          });
        }
      } catch (err) {
        console.error("Failed to acquire wake lock:", err);
      }
    };

    requestWakeLock();

    // Release the wake lock on cleanup.
    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          console.log("Wake lock released on cleanup");
        });
      }
    };
  }, []);

  // Load Tabata workout from localStorage on mount.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentTabataWorkout");
    if (savedWorkout) {
      let parsed = JSON.parse(savedWorkout) as TabataWorkout;
      // Normalize each exercise to ensure numeric fields.
      parsed.exercises = parsed.exercises.map((ex: Exercise) => ({
        ...ex,
        reps: ex.reps ?? 0,
        distance: ex.distance ?? 0,
        calories: ex.calories ?? 0,
      }));
      setWorkout(parsed);
      // Start with the work interval.
      setTimeRemaining(parsed.workTime);
      setIsWorkInterval(true);
      // Calculate total rounds (each exercise is done per round).
      const total = parsed.rounds * parsed.exercises.length;
      setTotalTime((parsed.workTime + parsed.restTime) * total);
    } else {
      router.push("/custom-workout/tabata");
    }
  }, [router]);

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

  // Always speak (and play beep) when needed.
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

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

  // Timer effect: alternate work and rest intervals.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          // Determine current interval duration.
          const currentIntervalDuration = isWorkInterval ? workout.workTime : workout.restTime;

          // At halfway point (only once per interval).
          if (!hasSpokenHalfway && newTime === Math.floor(currentIntervalDuration / 2)) {
            speak("Halfway");
            setHasSpokenHalfway(true);
          }
          // At 3 seconds remaining, play beep.
          if (newTime === 3) {
            beep();
          }
          if (newTime <= 0) {
            // Calculate total rounds: workout.rounds * number of exercises.
            const totalRounds = workout.rounds * workout.exercises.length;
            if (currentRound >= totalRounds) {
              handleComplete();
              return 0;
            }
            // Reset halfway flag for next interval.
            setHasSpokenHalfway(false);
            // Switch intervals.
            if (isWorkInterval) {
              speak("Rest");
              setIsWorkInterval(false);
              return workout.restTime;
            } else {
              const nextIndex = (currentExerciseIndex + 1) % workout.exercises.length;
              setCurrentExerciseIndex(nextIndex);
              speak(`Next up: ${workout.exercises[nextIndex].name}`);
              setIsWorkInterval(true);
              setCurrentRound(currentRound + 1);
              return workout.workTime;
            }
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, workout, currentRound, isWorkInterval, currentExerciseIndex, hasSpokenHalfway, speak]);

  // Announce the first exercise and round on mount.
  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      speak(`${workout.exercises[0].name}, Round 1`);
    }
  }, [workout]);

  // Start/resume/pause the workout.
  const startWorkout = () => {
    if (isRunning) {
      setIsRunning(false);
      setIsPaused(true);
    } else if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
    } else {
      setShowCountdown(true);
    }
  };

  // Callback when the countdown completes.
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
    router.push("/custom-workout/tabata/session");
  };

  // Format seconds as mm:ss.
  const formatTimeDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!workout) return null;

  const displayRound = Math.ceil(currentRound / 2);
  const totalRounds = workout.rounds;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/custom-workout/tabata"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => localStorage.removeItem("currentTabataWorkout")}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Exit Workout
          </Link>
          <button
            onClick={handleComplete}
            className="flex items-center text-red-500 hover:text-red-600 transition-colors"
          >
            <XCircle className="w-5 h-5 mr-1" />
            End Workout
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-center">{workout.name}</h1>

        <div className="text-center mb-4">
          <span className="text-xl font-semibold text-gray-600">
            Round {displayRound}/{totalRounds}
          </span>
          <div className="text-lg text-gray-500 mt-1">
            {workout.exercises[currentExerciseIndex].name}
          </div>
        </div>

        <div className="text-center mb-4">
          <span className={`text-xl font-bold ${isWorkInterval ? "text-green-500" : "text-red-500"}`}>
            {isWorkInterval ? "WORK" : "REST"}
          </span>
        </div>

        <div className="text-center mb-8">
          <div className={`text-6xl font-mono font-bold mb-4 ${timeRemaining <= 3 ? "text-red-500" : ""}`}>
            {showCountdown ? (
              <WorkoutCountdown
                onComplete={handleCountdownComplete}
                onStart={() => {
                  setIsRunning(false);
                  setIsPaused(false);
                }}
              />
            ) : (
              formatTimeDisplay(timeRemaining)
            )}
          </div>
          <div className="flex justify-center gap-4 items-center">
            <button
              onClick={startWorkout}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
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
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            {workout.rounds} Round{workout.rounds > 1 ? "s" : ""} of Tabata:
            <span className="block text-base font-normal text-gray-600 mt-1">
              {workout.workTime}s work / {workout.restTime}s rest
            </span>
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id}>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {exercise.metric === "reps" && exercise.reps ? `${exercise.reps} reps` : ""}
                  {exercise.metric === "distance" && exercise.distance ? `${exercise.distance} m` : ""}
                  {exercise.metric === "calories" && exercise.calories ? `${exercise.calories} cals` : ""}
                  {exercise.weight ? ` (Weight: ${exercise.weight} kg)` : ""}
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
                  onShare={async () => {}}
                  workout={{
                    name: workout.name,
                    type: "TABATA",
                    exercises: workout.exercises,
                    duration: totalTime.toString(),
                    difficulty: workout.difficulty,
                    targetMuscles: workout.targetMuscles,
                    workTime: workout.workTime,
                    restTime: workout.restTime,
                    rounds: workout.rounds,
                  }}
                  duration={totalTime}
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
