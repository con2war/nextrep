"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, XCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkoutSummary from "@/app/components/WorkoutSummary";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";

// Helper function to format seconds as mm:ss.
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
  const currentRoundRef = useRef(currentRound);
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isWorkInterval, setIsWorkInterval] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  // This flag ensures that the halfway cue is only played once per interval.
  const [hasSpokenHalfway, setHasSpokenHalfway] = useState(false);

  // --- Keep screen awake using Wake Lock API ---
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          console.log("Wake lock acquired");
          wakeLock.addEventListener("release", () => {
            console.log("Wake lock was released");
          });
        } catch (err) {
          console.error("Failed to acquire wake lock:", err);
        }
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          console.log("Wake lock released on cleanup");
          wakeLock = null;
        });
      }
    };
  }, []);
  // --- End Wake Lock API ---

  // Web Audio API states for all audio cues.
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [beepBuffer, setBeepBuffer] = useState<AudioBuffer | null>(null);
  const [letsgoBuffer, setLetsgoBuffer] = useState<AudioBuffer | null>(null);
  const [workBuffer, setWorkBuffer] = useState<AudioBuffer | null>(null);
  const [restBuffer, setRestBuffer] = useState<AudioBuffer | null>(null);
  const [halfwayBuffer, setHalfwayBuffer] = useState<AudioBuffer | null>(null);
  const [lastRoundBuffer, setLastRoundBuffer] = useState<AudioBuffer | null>(null);

  // Helper to load an AudioBuffer from a URL.
  const loadAudioBuffer = async (
    ctx: AudioContext,
    url: string
  ): Promise<AudioBuffer> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  };

  // Initialize or resume the AudioContext and load all audio buffers.
  const initAudioContext = useCallback(async () => {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error("Web Audio API is not supported in this browser");
        return;
      }
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
      try {
        const [beep, letsgo, work, rest, halfway, lastRound] = await Promise.all([
          loadAudioBuffer(ctx, "/beep.mp3"),
          loadAudioBuffer(ctx, "/letsgo.mp3"),
          loadAudioBuffer(ctx, "/work.mp3"),
          loadAudioBuffer(ctx, "/rest.mp3"),
          loadAudioBuffer(ctx, "/halfway.mp3"),
          loadAudioBuffer(ctx, "/lastround.mp3"),
        ]);
        setBeepBuffer(beep);
        setLetsgoBuffer(letsgo);
        setWorkBuffer(work);
        setRestBuffer(rest);
        setHalfwayBuffer(halfway);
        setLastRoundBuffer(lastRound);
      } catch (error) {
        console.error("Error loading audio buffers:", error);
      }
    } else if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }, [audioContext]);

  // Playback helper functions.
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

  const playLetsgo = useCallback(() => {
    if (audioContext && letsgoBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = letsgoBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or let's go buffer not ready");
    }
  }, [audioContext, letsgoBuffer]);

  const playWork = useCallback(() => {
    if (audioContext && workBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = workBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or work buffer not ready");
    }
  }, [audioContext, workBuffer]);

  const playRest = useCallback(() => {
    if (audioContext && restBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = restBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or rest buffer not ready");
    }
  }, [audioContext, restBuffer]);

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

  const playLastRound = useCallback(() => {
    if (audioContext && lastRoundBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = lastRoundBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      console.error("Audio context or last round buffer not ready");
    }
  }, [audioContext, lastRoundBuffer]);

  // Load the Tabata workout from localStorage.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentTabataWorkout");
    if (savedWorkout) {
      let parsed = JSON.parse(savedWorkout) as TabataWorkout;
      // Normalize each exercise numeric fields.
      parsed.exercises = parsed.exercises.map((ex: Exercise) => ({
        ...ex,
        reps: ex.reps ?? 0,
        distance: ex.distance ?? 0,
        calories: ex.calories ?? 0,
      }));
      setWorkout(parsed);
      setTimeRemaining(parsed.workTime);
      setIsWorkInterval(true);
      // Calculate total rounds (each round applies to each exercise).
      const total = parsed.rounds * parsed.exercises.length;
      setTotalTime((parsed.workTime + parsed.restTime) * total);
    } else {
      router.push("/custom-workout/tabata");
    }
  }, [router]);

  // Timer effect: alternate work and rest intervals.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const currentIntervalDuration = isWorkInterval ? workout.workTime : workout.restTime;
          const newTime = prevTime - 1;
          const totalRounds = workout.rounds * workout.exercises.length;
          
          // Announce last round (if in work interval at the start)
          if (currentRoundRef.current === totalRounds - 1 && isWorkInterval && prevTime === workout.workTime) {
            playLastRound();
          }
          
          // Halfway cue (only once per interval)
          if (!hasSpokenHalfway && newTime === Math.floor(currentIntervalDuration / 2)) {
            playHalfway();
            setHasSpokenHalfway(true);
          }
          
          // Beep cue at exactly 3 seconds remaining.
          if (newTime === 3) {
            playBeep();
          }
          
          if (newTime <= 0) {
            if (isWorkInterval) {
              setIsWorkInterval(false);
              playRest();
              setHasSpokenHalfway(false);
              return workout.restTime;
            } else {
              // In rest interval, update exercise and possibly round.
              let newExerciseIndex = currentExerciseIndex;
              let newRound = currentRoundRef.current;
              if (currentExerciseIndex < workout.exercises.length - 1) {
                newExerciseIndex = currentExerciseIndex + 1;
              } else {
                newExerciseIndex = 0;
                newRound = currentRoundRef.current + 1;
                setCurrentRound(newRound);
                currentRoundRef.current = newRound;
              }
              setCurrentExerciseIndex(newExerciseIndex);
              
              if (newRound < totalRounds) {
                setIsWorkInterval(true);
                playWork();
                setHasSpokenHalfway(false);
                return workout.workTime;
              } else {
                handleComplete();
                return 0;
              }
            }
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [
    isRunning,
    isPaused,
    workout,
    currentExerciseIndex,
    isWorkInterval,
    hasSpokenHalfway,
    playWork,
    playRest,
    playHalfway,
    playLastRound,
    playBeep,
  ]);

  // Announce the first work cue on mount.
  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      playWork();
    }
  }, [workout, playWork]);

  // Start/resume/pause the workout.
  const startOrToggleWorkout = useCallback(() => {
    // Ensure AudioContext is unlocked.
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

  // Callback when the countdown completes.
  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setIsRunning(true);
    setIsPaused(false);
    playLetsgo();
  }, [playLetsgo]);

  // End workout: stop timer, record completion, and show summary.
  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    setCompletedAt(new Date());
    setShowSummary(true);
  }, []);

  // When the user clicks "Start Workout" in the summary modal.
  const handleStartWorkout = useCallback(() => {
    if (!workout) return;
    localStorage.setItem("selectedWorkout", JSON.stringify(workout));
    router.push("/custom-workout/tabata/session");
  }, [workout, router]);

  if (!workout) return null;

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
            <span>End Workout</span>
            <XCircle className="w-5 h-5 mr-1" />
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-center">{workout.name}</h1>

        <div className="text-center mb-4">
          <span className="text-xl font-semibold text-gray-600">
            Round {Math.ceil(currentRound / workout.exercises.length)}/{workout.rounds}
          </span>
          <div className="text-lg text-gray-500 mt-1">
            {workout.exercises[currentExerciseIndex].name}
          </div>
        </div>

        <div className="text-center mb-4">
          <span
            className={`text-xl font-bold ${
              isWorkInterval ? "text-green-500" : "text-red-500"
            }`}
          >
            {isWorkInterval ? "WORK" : "REST"}
          </span>
        </div>

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
