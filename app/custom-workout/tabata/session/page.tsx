// app/custom-workout/tabata/session/page.tsx
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

interface TabataWorkout {
  name: string;
  rounds: number; // number of rounds
  workInterval: number; // seconds for work interval (may be unused if you use workTime/restTime)
  restInterval: number; // seconds for rest interval
  exercises: Exercise[];
  workTime: number; // seconds for work period
  restTime: number; // seconds for rest period
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
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Load Tabata workout from localStorage on mount.
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentTabataWorkout");
    if (savedWorkout) {
      let parsedWorkout = JSON.parse(savedWorkout) as TabataWorkout;
      // Normalize each exercise so that it has a numeric value for each possible metric.
      parsedWorkout.exercises = parsedWorkout.exercises.map((ex: Exercise) => {
        return {
          ...ex,
          reps: ex.reps ?? 0,
          distance: ex.distance ?? 0,
          calories: ex.calories ?? 0,
        };
      });
      setWorkout(parsedWorkout);
      setTimeRemaining(parsedWorkout.workTime);
      setIsWorkInterval(true);
      // Calculate total workout time: (workTime + restTime) * rounds * number of exercises
      const total = (parsedWorkout.workTime + parsedWorkout.restTime) * parsedWorkout.rounds * parsedWorkout.exercises.length;
      setTotalTime(total);
    } else {
      router.push("/custom-workout/tabata");
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
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          voices = window.speechSynthesis.getVoices();
        });
      }
      const preferredVoice = voices.find(
        (voice) =>
          (voice.name.includes("Male") ||
            voice.name.includes("Daniel") ||
            voice.name.includes("David") ||
            voice.name.includes("James")) &&
          (voice.lang.includes("en-US") || voice.lang.includes("en-GB"))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.pitch = 1.1;
      utterance.rate = 1.2;
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

  const handleComplete = () => {
    setIsRunning(false);
    setCompletedAt(new Date());
    speak("Well done");
    setShowSummary(true);
  };

  // Timer logic: alternate work and rest intervals.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused && workout) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime === 3) {
            console.log("3 seconds remaining - Playing beep");
            beep();
          }
          if (newTime <= 0) {
            const totalRounds = workout.rounds * workout.exercises.length;
            if (currentRound >= totalRounds) {
              handleComplete();
              return 0;
            }
            const nextRound = currentRound + 1;
            setCurrentRound(nextRound);
            if (isWorkInterval) {
              speak("Rest");
              setTimeRemaining(workout.restTime);
              setIsWorkInterval(false);
            } else {
              const nextIndex = (currentExerciseIndex + 1) % workout.exercises.length;
              setCurrentExerciseIndex(nextIndex);
              setTimeRemaining(workout.workTime);
              setIsWorkInterval(true);
              speak(`Next up: ${workout.exercises[nextIndex].name}`);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, workout, currentRound, isWorkInterval, currentExerciseIndex]);

  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      speak(`${workout.exercises[0].name}, Round 1`);
    }
  }, [workout]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!workout) return null;

  const displayRound = Math.ceil(currentRound / 2);
  const totalRounds = workout.rounds * workout.exercises.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
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
                onComplete={() => {
                  setShowCountdown(false);
                  setIsRunning(true);
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
              className={`p-2 rounded-lg ${isAudioEnabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white transition-colors`}
              title={isAudioEnabled ? "Disable Audio" : "Enable Audio"}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

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
                    difficulty: "medium",
                    targetMuscles: [],
                    workTime: workout.workTime,
                    restTime: workout.restTime,
                    rounds: workout.rounds
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
