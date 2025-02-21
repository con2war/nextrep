"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";
import WorkoutSummary from "@/app/components/WorkoutSummary";

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
  exercises: Exercise[];
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

  // Web Audio API states for all sounds.
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [beepBuffer, setBeepBuffer] = useState<AudioBuffer | null>(null);
  const [halfwayBuffer, setHalfwayBuffer] = useState<AudioBuffer | null>(null);
  const [tenSecondsBuffer, setTenSecondsBuffer] = useState<AudioBuffer | null>(null);
  const [letsgoBuffer, setLetsgoBuffer] = useState<AudioBuffer | null>(null);
  const [welldoneBuffer, setWelldoneBuffer] = useState<AudioBuffer | null>(null);

  // Helper to load an AudioBuffer from a URL.
  const loadAudioBuffer = async (
    ctx: AudioContext,
    url: string
  ): Promise<AudioBuffer> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  };

  // Initialize or resume the AudioContext and load our audio buffers.
  const initAudioContext = useCallback(async () => {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error("Web Audio API is not supported in this browser");
        return;
      }
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
      try {
        const [beep, halfway, tenSeconds, letsgo, welldone] =
          await Promise.all([
            loadAudioBuffer(ctx, "/beep.mp3"),
            loadAudioBuffer(ctx, "/halfway.mp3"),
            loadAudioBuffer(ctx, "/10s.mp3"),
            loadAudioBuffer(ctx, "/letsgo.mp3"),
            loadAudioBuffer(ctx, "/welldone.mp3"),
          ]);
        setBeepBuffer(beep);
        setHalfwayBuffer(halfway);
        setTenSecondsBuffer(tenSeconds);
        setLetsgoBuffer(letsgo);
        setWelldoneBuffer(welldone);
      } catch (error) {
        console.error("Error loading audio buffers:", error);
      }
    } else if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }, [audioContext]);

  // Playback helpers using the Web Audio API.
  const playBeep = useCallback(() => {
    if (audioContext && beepBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = beepBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or beep buffer not ready");
    }
  }, [audioContext, beepBuffer]);

  const playHalfway = useCallback(() => {
    if (audioContext && halfwayBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = halfwayBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or halfway buffer not ready");
    }
  }, [audioContext, halfwayBuffer]);

  const playTenSeconds = useCallback(() => {
    if (audioContext && tenSecondsBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = tenSecondsBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or ten seconds buffer not ready");
    }
  }, [audioContext, tenSecondsBuffer]);

  const playLetsgo = useCallback(() => {
    if (audioContext && letsgoBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = letsgoBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or letsgo buffer not ready");
    }
  }, [audioContext, letsgoBuffer]);

  const playWellDone = useCallback(() => {
    if (audioContext && welldoneBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = welldoneBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or welldone buffer not ready");
    }
  }, [audioContext, welldoneBuffer]);

  // Load and normalize the EMOM workout from localStorage.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentEmomWorkout");
    if (savedWorkout) {
      let parsed = JSON.parse(savedWorkout) as EmomWorkout;
      parsed.exercises = normalizeExercises(parsed.exercises);
      if (!parsed.intervalTime) {
        parsed.intervalTime = 30;
      }
      if (!parsed.roundsPerMovement) {
        parsed.roundsPerMovement = 1;
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
          const totalRounds =
            workout.roundsPerMovement * workout.exercises.length;

          // At halfway through the interval, play halfway.mp3.
          if (newTime === Math.floor(workout.intervalTime / 2)) {
            playHalfway();
          }
          // When 10 seconds remain, play 10s.mp3.
          if (newTime === 10) {
            playTenSeconds();
          }
          // When 3 seconds remain, play beep.mp3.
          if (newTime === 3) {
            playBeep();
          }
          if (newTime <= 0) {
            if (currentRound >= totalRounds) {
              handleComplete();
              return 0;
            } else {
              setCurrentRound(currentRound + 1);
              const nextIdx = (currentExercise + 1) % workout.exercises.length;
              setCurrentExercise(nextIdx);
              return workout.intervalTime;
            }
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [
    isRunning,
    workout,
    currentRound,
    currentExercise,
    playHalfway,
    playTenSeconds,
    playBeep,
  ]);

  // Start/resume/pause the workout.
  // Also initialize/resume the AudioContext to ensure it’s unlocked for iOS.
  const startOrToggleWorkout = useCallback(() => {
    initAudioContext();
    if (!isRunning && !isPaused) {
      setShowCountdown(true);
    } else if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
    } else {
      setIsRunning(false);
      setIsPaused(true);
    }
  }, [isRunning, isPaused, initAudioContext]);

  // Update the countdown handling.
  const handleCountdownStart = useCallback(() => {
    requestAnimationFrame(() => {
      setIsRunning(false);
      setIsPaused(false);
    });
  }, []);

  const handleCountdownComplete = useCallback(() => {
    requestAnimationFrame(() => {
      setShowCountdown(false);
      setIsRunning(true);
      setIsPaused(false);
      playLetsgo();
    });
  }, [playLetsgo]);

  // End workout: when the user clicks "End Workout" or all rounds complete, play welldone.mp3.
  const handleComplete = () => {
    setIsRunning(false);
    setIsPaused(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCompletedAt(new Date());
    playWellDone();
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
          <h1 className="text-3xl font-bold">
            {workout.name || "EMOM Workout"}
          </h1>
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
                onStart={handleCountdownStart}
              />
            ) : (
              formatTime(timeRemaining)
            )}
          </div>
          <div className="text-lg font-medium text-gray-600 mb-4">
            Round {currentRound} of{" "}
            {workout.roundsPerMovement * workout.exercises.length}
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
            Every {workout.intervalTime} seconds for {workout.roundsPerMovement}{" "}
            set{workout.roundsPerMovement > 1 ? "s" : ""}:
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id}>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {exercise.metric === "reps" && exercise.reps !== undefined
                    ? `${exercise.reps} reps`
                    : exercise.metric === "distance" &&
                      exercise.distance !== undefined
                    ? `${exercise.distance} m`
                    : exercise.metric === "calories" &&
                      exercise.calories !== undefined
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
