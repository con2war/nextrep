"use client"

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
import WorkoutSummary from "@/app/components/WorkoutSummary";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";
import Image from "next/image";

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

interface SaveWorkoutPayload {
  name: string;
  type: "EMOM";
  duration: string;
  difficulty: string;
  targetMuscles: string[];
  exercises: string; // JSON stringified exercises array
  intervalTime: number;
  roundsPerMovement: number;
}

export default function EmomSession({
}: {
  onComplete?: (summary: SaveWorkoutPayload) => void;
}) {
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
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Initialize beep sound on mount
  useEffect(() => {
    const audio = new Audio("/beep.mp3");
    audio.volume = 0.5;
    audio.preload = "auto";
    audio.addEventListener("error", (e) => {
      console.error("Audio loading error:", e);
    });
    audio.addEventListener("canplaythrough", () => {
      console.log("Audio loaded successfully");
    });
    try {
      audio.load();
      setBeepSound(audio);
    } catch (error) {
      console.error("Error loading audio:", error);
    }
    return () => {
      audio.removeEventListener("error", () => { });
      audio.removeEventListener("canplaythrough", () => { });
    };
  }, []);

  const testAudio = () => {
    if (isAudioEnabled && beepSound) {
      beepSound.currentTime = 0;
      const playPromise = beepSound.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            beepSound.pause();
            beepSound.currentTime = 0;
            console.log("Beep sound tested successfully");
          })
          .catch((error) => console.error("Beep test error:", error));
      }
      if ("speechSynthesis" in window) {
        const testUtterance = new SpeechSynthesisUtterance("Audio check");
        testUtterance.volume = 1.5;
        window.speechSynthesis.speak(testUtterance);
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (!audioInitialized) {
      testAudio();
      setAudioInitialized(true);
    }
  };

  const speak = (text: string) => {
    if (isAudioEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleComplete = () => {
    // Stop the timer and speech
    setIsRunning(false);
    setIsPaused(true);
    window.speechSynthesis.cancel();

    setCompletedAt(new Date());
    setShowSummary(true);
    speak("Well Done");
  };

  // Load workout data from localStorage on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentEmomWorkout");
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout);
      console.log("Loaded EMOM workout:", parsedWorkout);
      setWorkout(parsedWorkout);
      setTimeRemaining(parsedWorkout.intervalTime);
    } else {
      router.push("/custom-workout/emom");
    }
  }, [router]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime === Math.floor(workout.intervalTime / 2)) {
            speak("Half way");
          }
          if (newTime === 10) {
            speak("10 seconds remaining");
          }
          if (newTime === 3) {
            window.speechSynthesis.cancel();
            if (beepSound) {
              beepSound.currentTime = 0;
              beepSound.play().catch((e) => console.error("Beep error:", e));
            }
          }
          if (newTime <= 0) {
            if (currentRound === workout.roundsPerMovement * workout.exercises.length) {
              handleComplete();
              return 0;
            }
            const nextRound = currentRound + 1;
            setCurrentRound(nextRound);
            const nextExerciseIndex =
              currentExercise + 1 >= workout.exercises.length ? 0 : currentExercise + 1;
            setCurrentExercise(nextExerciseIndex);
            setTimeout(() => {
              if (workout.exercises[nextExerciseIndex]) {
                speak(`Next up: ${workout.exercises[nextExerciseIndex].name}`);
              }
            }, 1000);
            return workout.intervalTime;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, workout, currentRound, currentExercise]);

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

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // --- Mapping function for saving an EMOM workout ---
  const mapEmomWorkoutForSaving = (
    workout: EmomWorkout,
    timer: number
  ): SaveWorkoutPayload => {
    const intervalTimeInSeconds =
      workout.intervalUnit === "minutes"
        ? workout.intervalTime * 60
        : workout.intervalTime;
    const mappedWorkout: SaveWorkoutPayload = {
      name: workout.name,
      type: "EMOM",
      duration: String(timer),
      difficulty: "medium", // default; adjust if needed
      targetMuscles: [],    // adjust if you add target muscles later
      // Convert the exercises array to a JSON string
      exercises: JSON.stringify(workout.exercises),
      intervalTime: intervalTimeInSeconds,
      roundsPerMovement: workout.roundsPerMovement,
    };
    return mappedWorkout;
  };

  const handleSave = async () => {
    console.log("Saving EMOM workout...");
    setShowSummary(false);
    if (!workout) return;
    const workoutToSave = mapEmomWorkoutForSaving(workout, timeRemaining);
    console.log("Workout to save:", workoutToSave);
    if (typeof onComplete === "function") {
      onComplete(workoutToSave);
    } else {
      try {
        const response = await fetch("/api/workouts/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workoutToSave),
        });
        if (!response.ok) throw new Error("Failed to save workout");
        console.log("Workout saved successfully!");
      } catch (error) {
        console.error("Error saving workout:", error);
      }
    }
  };

  if (!workout) return null;

  const totalRounds = workout.roundsPerMovement * workout.exercises.length;
  const currentExerciseIndex = Math.floor((currentRound - 1) / workout.roundsPerMovement) % workout.exercises.length;

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
              // Stop timer and speech
              setIsRunning(false);
              setIsPaused(true);
              window.speechSynthesis.cancel();
              // Record the completion time and show the summary
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

        {/* Workout Name */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold ml-2">{workout.name}</h1>
        </div>

        {/* Timer and Rounds Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-mono font-bold mb-4 ${timeRemaining <= 3 ? "text-red-500" : ""}`}>
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
              formatTime(timeRemaining)
            )}
          </div>
          <div className="text-lg font-medium text-gray-600 mb-4">
            Round {Math.min(currentRound, totalRounds)} of {totalRounds}
          </div>
          <div className="flex justify-center gap-4 items-center">
            <button
              onClick={startWorkout}
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
              onClick={toggleAudio}
              className={`p-2 rounded-lg ${isAudioEnabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white transition-colors`}
              title={isAudioEnabled ? "Disable Audio" : "Enable Audio"}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Workout Details (Optional display of exercises) */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Every {workout.intervalTime} seconds for {workout.roundsPerMovement} set{workout.roundsPerMovement > 1 ? "s" : ""}:
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id}>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {exercise.metric === "reps" && exercise.reps
                    ? `${exercise.reps} reps`
                    : exercise.metric === "distance" && exercise.distance
                      ? `${exercise.distance}m`
                      : exercise.metric === "calories" && exercise.calories
                        ? `${exercise.calories} cals`
                        : ""}
                  {exercise.weight ? ` (${exercise.weight}kg)` : ""}
                </p>
                {exercise.notes && (
                  <p className="text-sm text-gray-400">{exercise.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workout Summary Component */}
        <WorkoutSummary
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          onSave={handleSave}
          onShare={async () => {
            try {
              const shareData = {
                title: workout?.name || "EMOM Workout",
                text: `I completed ${workout?.name} - ${workout?.roundsPerMovement} sets of ${workout?.exercises.length} exercises!`,
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
          }}
          workout={{
            name: workout.name,
            type: "EMOM",
            // For EMOM, we expect a flattened array of exercises.
            exercises: workout.exercises,
            intervalTime: workout.intervalTime,
            roundsPerMovement: workout.roundsPerMovement,
          }}
          duration={timeRemaining}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  );
}
