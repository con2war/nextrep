// app/custom-workout/for-time/session/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Play, Pause, XCircle, ChevronLeft, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkoutSummary from "@/app/components/WorkoutSummary";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";

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

interface ForTimeWorkout {
  name: string;
  rounds: number;
  exercises: Exercise[];
}

export default function ForTimeSession() {
  const router = useRouter();
  const [workout, setWorkout] = useState<ForTimeWorkout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Load For Time workout from localStorage and normalize each exercise.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentForTimeWorkout");
    if (savedWorkout) {
      let parsedWorkout = JSON.parse(savedWorkout) as ForTimeWorkout;
      // Normalize each exercise so that reps, distance, and calories are always numbers.
      parsedWorkout.exercises = parsedWorkout.exercises.map((ex: Exercise) => ({
        ...ex,
        reps: ex.reps ?? 0,
        distance: ex.distance ?? 0,
        calories: ex.calories ?? 0,
      }));
      setWorkout(parsedWorkout);
      // For For Time workouts, you might choose a default timer value (e.g. based on rounds or user input).
      // For example, here we set timeRemaining to 0 initially.
      setTimeRemaining(0);
      // Optionally, compute totalTime if needed. For instance, you might decide totalTime = rounds * some fixed interval.
      // (Since For Time workouts do not have a time cap, adjust as needed.)
      setTotalTime(0);
    } else {
      router.push("/custom-workout/for-time");
    }
  }, [router]);

  // Initialize beep sound on mount.
  useEffect(() => {
    const audio = new Audio("/beep.mp3");
    audio.volume = 0.5;
    audio.preload = "auto";
    audio.addEventListener("error", (e) => console.error("Audio loading error:", e));
    audio.addEventListener("canplaythrough", () => console.log("Audio loaded successfully"));
    try {
      audio.load();
      setBeepSound(audio);
    } catch (error) {
      console.error("Error loading audio:", error);
    }
    return () => {
      audio.removeEventListener("error", () => {});
      audio.removeEventListener("canplaythrough", () => {});
    };
  }, []);

  const speak = (text: string) => {
    if (isAudioEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

  const beep = () => {
    if (isAudioEnabled && beepSound) {
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

  // Timer effect: decrease timeRemaining every second.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          // Example: beep at 3 seconds remaining.
          if (newTime === 3) {
            console.log("3 seconds remaining - Playing beep");
            beep();
          }
          if (newTime <= 0) {
            // For For Time workouts, you might simply stop the timer at 0.
            setIsRunning(false);
            setCompletedAt(new Date());
            speak("Workout complete");
            setShowSummary(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, workout]);

  // Optionally, announce the first exercise on mount if needed.
  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      speak(`${workout.exercises[0].name} start`);
    }
  }, [workout]);

  const startWorkout = () => {
    // For For Time workouts, you might start the timer immediately (or have a countdown)
    // Here, we simply set isRunning to true.
    if (workout) {
      // You could set a starting time if desired.
      // For example, setTimeRemaining( ... ) based on user input.
      setIsRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!workout) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/custom-workout/for-time"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Workout Types
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-center">{workout.name}</h1>

        {/* For Time workouts typically run until completion; you might show a timer or progress bar here */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold mb-4">
            {formatTime(timeRemaining)}
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
            <button
              onClick={() => {
                setIsRunning(false);
                setCompletedAt(new Date());
                speak("Workout complete");
                setShowSummary(true);
              }}
              className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              End Workout
            </button>
          </div>
        </div>

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            {workout.rounds} Round{workout.rounds > 1 ? "s" : ""} For Time:
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id}>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {exercise.metric === "reps" && exercise.reps ? `${exercise.reps} reps` : ""}
                  {exercise.metric === "distance" && exercise.distance ? `${exercise.distance}m` : ""}
                  {exercise.metric === "calories" && exercise.calories ? `${exercise.calories} cals` : ""}
                  {exercise.weight ? ` (${exercise.weight}kg)` : ""}
                </p>
                {exercise.notes && (
                  <p className="text-sm text-gray-400">{exercise.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* End-of-Workout Summary Modal */}
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
                    type: "FOR TIME",
                    exercises: workout.exercises,
                    duration: "", // For For Time workouts, you may choose not to pass a time cap.
                    difficulty: "medium",
                    targetMuscles: []
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
