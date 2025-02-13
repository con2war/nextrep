"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, XCircle, ChevronLeft, Volume2, VolumeX } from "lucide-react";
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

interface AmrapWorkout {
  name: string;
  timeCap: number; // in minutes
  exercises: Exercise[];
  timer: number; // in seconds (loaded from storage)
  difficulty?: string;
  targetMuscles?: string[];
}

export default function AmrapSession() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [workout, setWorkout] = useState<AmrapWorkout | null>(null);
  const [hasAnnouncedHalfway, setHasAnnouncedHalfway] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null);

  // Request a wake lock so the screen stays awake.
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          console.log("Wake Lock is active");
        }
      } catch (err) {
        console.error("Failed to obtain wake lock:", err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          console.log("Wake Lock released");
          wakeLock = null;
        });
      }
    };
  }, []);

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

  // Always speak when needed.
  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Always play beep.
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

  // Scroll to top on mount.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load workout data on mount and normalize numeric fields.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentAmrapWorkout");
    if (savedWorkout) {
      let parsedWorkout = JSON.parse(savedWorkout) as AmrapWorkout;
      parsedWorkout.exercises = parsedWorkout.exercises.map((ex: Exercise) => ({
        ...ex,
        reps: ex.reps ?? 0,
        distance: ex.distance ?? 0,
        calories: ex.calories ?? 0,
        weight: ex.weight ?? 0,
      }));
      setWorkout(parsedWorkout);
      setTimeRemaining(parsedWorkout.timer);
      setTotalTime(parsedWorkout.timeCap * 60);
    } else {
      router.push("/custom-workout/amrap");
    }
  }, [router]);

  // Timer logic: countdown from timeCap (converted to seconds).
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          // When 3 seconds remain, play the beep.
          if (newTime === 3) {
            beep();
          }
          // When halfway through the workout, speak "Half way".
          if (!hasAnnouncedHalfway && newTime === Math.floor(totalTime / 2)) {
            speak("Half way");
            setHasAnnouncedHalfway(true);
          }
          // When 1 minute remains, speak "1 minute remaining".
          if (newTime === 60) {
            speak("1 minute remaining");
          }
          if (newTime <= 0) {
            handleComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, workout, totalTime, hasAnnouncedHalfway, speak]);

  const startWorkout = () => {
    if (!isRunning && !isPaused) {
      // Start with a countdown.
      setShowCountdown(true);
    } else if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
    } else {
      setIsRunning(false);
      setIsPaused(true);
    }
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setIsRunning(true);
    setIsPaused(false);
    speak("Let's Go");
  };

  const handleComplete = () => {
    setIsRunning(false);
    setIsPaused(true);
    window.speechSynthesis.cancel();
    setCompletedAt(new Date());
    speak("Well done");
    setShowSummary(true);
  };

  // Handler for sharing workout summary.
  const handleShare = async () => {
    try {
      const shareData = {
        title: workout?.name || "AMRAP Workout",
        text: `I completed ${workout?.name} - ${workout?.timeCap} minute AMRAP!`,
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

  // When the user clicks "Start Workout" in the summary modal.
  const handleStartWorkout = () => {
    if (!workout) return;
    localStorage.setItem("selectedWorkout", JSON.stringify(workout));
    router.push("/custom-workout/amrap/session");
  };

  // Format seconds as mm:ss.
  const formatTime = (seconds: number): string => {
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
            href="/custom-workout/amrap"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => localStorage.removeItem("currentAmrapWorkout")}
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

        {/* Workout Name */}
        <h1 className="text-3xl font-bold mb-4 text-center">
          {workout.name || "AMRAP Workout"}
        </h1>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div
            className={`text-6xl font-mono font-bold mb-4 ${timeRemaining <= 10 ? "text-red-500" : ""}`}
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

        {/* Display Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {workout.timeCap} Minute AMRAP:
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id}>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {exercise.metric === "reps" && exercise.reps
                    ? `${exercise.reps} reps`
                    : exercise.metric === "distance" && exercise.distance
                    ? `${exercise.distance} m`
                    : exercise.metric === "calories" && exercise.calories
                    ? `${exercise.calories} cals`
                    : ""}
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
        <WorkoutSummary
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          onSave={() => {}}
          onShare={handleShare}
          workout={{
            name: workout.name,
            type: "AMRAP",
            exercises: Array.isArray(workout.exercises)
              ? workout.exercises
              : JSON.stringify(workout.exercises),
            timeCap: workout.timeCap,
          }}
          duration={totalTime || workout.timeCap * 60}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  );
}
