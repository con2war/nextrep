"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, XCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkoutSummary from "@/app/components/WorkoutSummary";
import WorkoutCountdown from "@/app/components/WorkoutCountdown";
import { formatDistanceToNow } from "date-fns";

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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isWorkInterval, setIsWorkInterval] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null);
  // This flag ensures that the halfway cue is only played once per interval.
  const [hasSpokenHalfway, setHasSpokenHalfway] = useState(false);
  const [beepAudio, setBeepAudio] = useState<HTMLAudioElement | null>(null);

  // Add a ref to track if we're on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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

  // Load TABATA workout from localStorage on mount.
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

  // Initialize beep sound (beep.mp3) on mount.
  useEffect(() => {
    // Pre-load multiple beep instances for iOS
    if (isIOS) {
      // Create an array of audio elements for iOS
      const beepInstances = Array(5).fill(null).map(() => {
        const beep = new Audio("/beep.mp3");
        beep.volume = 1.0;
        beep.preload = "auto";
        return beep;
      });

      // iOS-specific setup for beep sounds
      const setupBeeps = async () => {
        try {
          await Promise.all(beepInstances.map(beep => beep.load()));
          
          // Create a touch event listener for iOS audio unlock
          document.addEventListener('touchstart', () => {
            beepInstances[0].play().then(() => {
              beepInstances[0].pause();
              beepInstances[0].currentTime = 0;
            }).catch(e => console.error("Beep setup failed:", e));
          }, { once: true });

          setBeepAudio(beepInstances[0]); // Store the first instance
        } catch (error) {
          console.error("Beep setup failed:", error);
        }
      };

      setupBeeps();

      // Cleanup
      return () => {
        beepInstances.forEach(beep => {
          beep.pause();
          beep.src = "";
        });
      };
    } else {
      // Non-iOS setup remains the same
      const bp = new Audio("/beep.mp3");
      bp.volume = 1.0;
      bp.preload = "auto";
      setBeepAudio(bp);

      return () => {
        bp.pause();
        bp.src = "";
      };
    }
  }, []);

  // --- Load Vocal Cue MP3s ---
  const [letsGoAudio, setLetsGoAudio] = useState<HTMLAudioElement | null>(null);
  const [workAudio, setWorkAudio] = useState<HTMLAudioElement | null>(null);
  const [restAudio, setRestAudio] = useState<HTMLAudioElement | null>(null);
  const [halfwayAudio, setHalfwayAudio] = useState<HTMLAudioElement | null>(null);
  const [lastRoundAudio, setLastRoundAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const lg = new Audio("/letsgo.mp3");
    lg.volume = 1.0;
    lg.preload = "auto";
    setLetsGoAudio(lg);

    const wa = new Audio("/work.mp3");
    wa.volume = 1.0;
    wa.preload = "auto";
    setWorkAudio(wa);

    const ra = new Audio("/rest.mp3");
    ra.volume = 1.0;
    ra.preload = "auto";
    setRestAudio(ra);

    const ha = new Audio("/halfway.mp3");
    ha.volume = 1.0;
    ha.preload = "auto";
    setHalfwayAudio(ha);

    const lr = new Audio("/lastround.mp3");
    lr.volume = 1.0;
    lr.preload = "auto";
    setLastRoundAudio(lr);

    const bp = new Audio("/beep.mp3");
    bp.volume = 1.0;
    bp.preload = "auto";
    setBeepAudio(bp);
  }, []);

  // MP3 playback helper functions.
  const playLetsGo = useCallback(() => {
    if (letsGoAudio) {
      letsGoAudio.currentTime = 0;
      letsGoAudio.play().catch((error) =>
        console.error("Error playing letsgo.mp3:", error)
      );
    }
  }, [letsGoAudio]);

  const playWork = useCallback(() => {
    if (workAudio) {
      workAudio.currentTime = 0;
      workAudio.play().catch((error) =>
        console.error("Error playing work.mp3:", error)
      );
    }
  }, [workAudio]);

  const playRest = useCallback(() => {
    if (restAudio) {
      restAudio.currentTime = 0;
      restAudio.play().catch((error) =>
        console.error("Error playing rest.mp3:", error)
      );
    }
  }, [restAudio]);

  const playHalfway = useCallback(() => {
    if (halfwayAudio) {
      halfwayAudio.currentTime = 0;
      halfwayAudio.play().catch((error) =>
        console.error("Error playing halfway.mp3:", error)
      );
    }
  }, [halfwayAudio]);

  const playLastRound = useCallback(() => {
    if (lastRoundAudio) {
      lastRoundAudio.currentTime = 0;
      lastRoundAudio.play().catch((error) =>
        console.error("Error playing lastround.mp3:", error)
      );
    }
  }, [lastRoundAudio]);

  // Enhanced playBeep function with iOS-specific handling
  const playBeep = useCallback(() => {
    if (isIOS) {
      // For iOS, create a new Audio instance each time
      const newBeep = new Audio("/beep.mp3");
      newBeep.volume = 1.0;
      
      // Play immediately
      const playPromise = newBeep.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing beep:", error);
          // Fallback attempt
          setTimeout(() => {
            newBeep.play().catch(e => console.error("Retry beep failed:", e));
          }, 50);
        });
      }
    } else {
      // Non-iOS handling
      if (beepAudio) {
        beepAudio.currentTime = 0;
        beepAudio.play().catch(error => 
          console.error("Error playing beep:", error)
        );
      }
    }
  }, [beepAudio]);

  // Timer effect: alternate work and rest intervals.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          const currentIntervalDuration = isWorkInterval
            ? workout.workTime
            : workout.restTime;
          const totalRounds = workout.rounds * workout.exercises.length;
          
          // Last round announcement
          if (currentRound === totalRounds - 1 && isWorkInterval && prevTime === workout.workTime) {
            playLastRound();
          }

          // Halfway point
          if (!hasSpokenHalfway && newTime === Math.floor(currentIntervalDuration / 2)) {
            playHalfway();
            setHasSpokenHalfway(true);
          }

          // Play beep at exactly 3 seconds remaining
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
              if (currentExerciseIndex < workout.exercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1);
              } else {
                setCurrentExerciseIndex(0);
                setCurrentRound(prev => prev + 1);
              }
              
              if (currentRound < totalRounds) {
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
    currentRound,
    currentExerciseIndex,
    isWorkInterval,
    hasSpokenHalfway,
    playWork,
    playRest,
    playHalfway,
    playLastRound,
    playBeep,
  ]);

  // Announce the first exercise and round on mount.
  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      // Play the work cue for the first exercise.
      playWork();
    }
  }, [workout, playWork]);

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

  // Callback when the countdown completes.
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setIsRunning(true);
    setIsPaused(false);
    // Play the "Let's Go" cue only once at the start.
    playLetsGo();
  };

  // End workout: stop timer, record completion, show summary.
  const handleComplete = () => {
    setIsRunning(false);
    setIsPaused(true);
    setCompletedAt(new Date());
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
