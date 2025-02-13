"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  XCircle,
  ChevronLeft,
  Volume2,
  VolumeX,
} from "lucide-react";
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

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function ForTimeSession() {
  const router = useRouter();
  const [workout, setWorkout] = useState<ForTimeWorkout | null>(null);
  // We'll use a count-up timer for For Time workouts.
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCounting, setIsCounting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  // totalTime is not used for For Time workouts because they run until stopped.
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Load For Time workout from localStorage and normalize exercises.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentForTimeWorkout");
    if (savedWorkout) {
      let parsedWorkout = JSON.parse(savedWorkout) as ForTimeWorkout;
      parsedWorkout.exercises = parsedWorkout.exercises.map((ex: Exercise) => ({
        ...ex,
        reps: ex.reps ?? 0,
        distance: ex.distance ?? 0,
        calories: ex.calories ?? 0,
      }));
      setWorkout(parsedWorkout);
      // Initially, timer is 0 (will count up).
      setWorkoutTimer(0);
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

  // Countdown effect: when countdown is active, decrease every second.
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (isCounting) {
      if (countdown > 0) {
        countdownTimer = setTimeout(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // Countdown complete: start the workout timer (count up).
        setIsCounting(false);
        setIsRunning(true);
        speak("Let's Go");
      }
    }
    return () => clearTimeout(countdownTimer);
  }, [isCounting, countdown]);

  // Workout timer effect: count up when running.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      timer = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, workout]);

  // Start workout: initiate countdown.
  const startWorkout = () => {
    setCountdown(3);
    setIsCounting(true);
    setIsPaused(false);
  };

  // End workout: stop timer, record completion, show summary.
  const endWorkout = () => {
    setIsRunning(false);
    setIsPaused(true);
    setCompletedAt(new Date());
    speak("Workout complete");
    setShowSummary(true);
  };

  // Toggle audio on/off.
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
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
          <button
            onClick={endWorkout}
            className="flex items-center text-red-500 hover:text-red-600 transition-colors"
          >
            <XCircle className="w-5 h-5 mr-1" />
            End Workout
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-center">{workout.name}</h1>

        {/* Display Countdown or Workout Timer */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold mb-4">
            {isCounting ? (
              <span>{countdown}</span>
            ) : (
              formatDuration(workoutTimer)
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
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg ${
                isAudioEnabled
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              } text-white transition-colors`}
              title={isAudioEnabled ? "Disable Audio" : "Enable Audio"}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {workout.rounds} Round{workout.rounds > 1 ? "s" : ""} For Time:
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
                    type: "FOR TIME",
                    exercises: workout.exercises,
                    duration: "", // For For Time workouts, no time cap.
                    difficulty: "medium",
                    targetMuscles: [],
                  }}
                  duration={workoutTimer}
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
