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
import { formatDistanceToNow } from "date-fns";
import { formatTime } from "@/app/utils/formatTime";

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
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Initialize beep sound on mount
  useEffect(() => {
    const audio = new Audio("/beep.mp3");
    audio.volume = 0.5;
    audio.preload = "auto";
    audio.load();
    setBeepSound(audio);
  }, []);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Load workout data from localStorage on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentEmomWorkout");
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout);
      setWorkout(parsedWorkout);
      setTimeRemaining(parsedWorkout.intervalTime);
    } else {
      router.push("/custom-workout/emom");
    }
  }, [router]);

  // Simple timer logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning && workout) {
      intervalId = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // End of interval; if finished all rounds, complete workout
            if (currentRound === workout.roundsPerMovement * workout.exercises.length) {
              setIsRunning(false);
              setIsPaused(true);
              setCompletedAt(new Date());
              speak("Well Done");
              return 0;
            } else {
              setCurrentRound(currentRound + 1);
              setCurrentExercise((currentExercise + 1) % workout.exercises.length);
              speak(`Next up: ${workout.exercises[(currentExercise + 1) % workout.exercises.length].name}`);
              return workout.intervalTime;
            }
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, workout, currentRound, currentExercise]);

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

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  // When user clicks "Start Workout" at the end, save the workout and navigate.
  const handleStartWorkout = () => {
    if (!workout) return;
    // Save the workout data (including unique fields) to localStorage.
    localStorage.setItem("selectedWorkout", JSON.stringify(workout));
    // For EMOM workouts, navigate to the EMOM session page.
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
            onClick={() => {
              setIsRunning(false);
              setIsPaused(true);
              setCompletedAt(new Date());
              speak("Well Done");
            }}
            className="text-gray-600 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <span>End Workout</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workout Name */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold">{workout.name}</h1>
        </div>

        {/* Timer and Round Info */}
        <div className="text-center mb-8">
          <div
            className={`text-6xl font-mono font-bold mb-4 ${
              timeRemaining <= 3 ? "text-red-500" : ""
            }`}
          >
            {showCountdown ? "Countdown..." : formatTime(timeRemaining)}
          </div>
          <div className="text-lg font-medium text-gray-600 mb-4">
            Round {currentRound} of {workout.roundsPerMovement * workout.exercises.length}
          </div>
          <div className="flex justify-center gap-4 items-center">
            <button
              onClick={startWorkout}
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

        {/* Single Action Button */}
        <div className="mt-8">
          <button
            onClick={handleStartWorkout}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Play className="w-5 h-5" />
            Start Workout
          </button>
        </div>
      </main>
    </div>
  );
}
