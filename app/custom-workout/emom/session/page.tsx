"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";
import WorkoutSummary from "@/app/components/WorkoutSummary";
import { formatDistanceToNow } from "date-fns";

// Helper to format seconds as mm:ss.
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
  exercises: Exercise[];
  difficulty?: string;
  targetMuscles?: string[];
}

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
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Initialize beep sound once on mount.
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

  // Helper: Speak a message.
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Load the EMOM workout from localStorage on mount.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentEmomWorkout");
    if (savedWorkout) {
      const parsed = JSON.parse(savedWorkout) as EmomWorkout;
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
  }, [isRunning, workout, currentRound, currentExercise]);

  // Start/resume/pause the workout.
  const startOrToggleWorkout = () => {
    if (!isRunning && !isPaused) {
      // First press: show countdown.
      setShowCountdown(true);
    } else if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
    } else {
      setIsRunning(false);
      setIsPaused(true);
    }
  };

  // Callback when the countdown completes.
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setIsRunning(true);
    setIsPaused(false);
    speak("Let's Go");
  };

  // End workout: stop timer, cancel vocals, record completion, show summary modal.
  const handleComplete = () => {
    setIsRunning(false);
    setIsPaused(true);
    window.speechSynthesis.cancel();
    setCompletedAt(new Date());
    speak("Well Done");
    setShowSummary(true);
  };

  // Toggle audio on/off.
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  // When the user clicks the "Start Workout" button in the summary modal,
  // save the workout details and restart the session.
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
          <h1 className="text-3xl font-bold">{workout.name}</h1>
        </div>

        {/* Timer & Round Info */}
        <div className="text-center mb-8">
          <div
            className={`text-6xl font-mono font-bold mb-4 ${
              timeRemaining <= 3 ? "text-red-500" : ""
            }`}
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
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg ${
                isAudioEnabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              } text-white transition-colors`}
              title={isAudioEnabled ? "Disable Audio" : "Enable Audio"}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Every {workout.intervalTime} seconds for {workout.roundsPerMovement} set
            {workout.roundsPerMovement > 1 ? "s" : ""}:
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
                {exercise.notes && <p className="text-sm text-gray-400">{exercise.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* End-of-Workout Summary Modal using WorkoutSummary with hideActions */}
        {showSummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <WorkoutSummary
                  isOpen={true}
                  onClose={() => setShowSummary(false)}
                  onSave={() => {}}
                  onShare={() => {}}
                  hideActions={true}
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
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowSummary(false);
                      handleStartWorkout();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Start Workout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


