"use client"

import { useState, useEffect } from "react";
import { Play, Pause, ChevronLeft, Volume2, VolumeX } from "lucide-react";
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

interface SaveForTimeWorkoutPayload {
  name: string;
  type: "FOR TIME";
  duration: string;
  difficulty: string;
  targetMuscles: string[];
  exercises: string; // JSON stringified array of exercises
  rounds: number;
}

const mapForTimeWorkoutForSaving = (
  workout: ForTimeWorkout,
  time: number
): SaveForTimeWorkoutPayload => {
  return {
    name: workout.name,
    type: "FOR TIME",
    duration: String(time),
    difficulty: "medium",
    targetMuscles: [],
    exercises: JSON.stringify(workout.exercises),
    rounds: workout.rounds,
  };
};

export default function ForTimeSession() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [workout, setWorkout] = useState<ForTimeWorkout | null>(null);
  const [hasAnnouncedStart, setHasAnnouncedStart] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
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
      utterance.volume = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleComplete = () => {
    window.speechSynthesis.cancel();
    setIsRunning(false);
    setCompletedAt(new Date());
    speak(`Final time ${Math.floor(time / 60)} minutes and ${time % 60} seconds`);
    setTimeout(() => {
      speak("Well Done");
      setShowSummary(true);
    }, 2000);
  };

  // Load workout data from localStorage on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentForTimeWorkout");
    if (savedWorkout) {
      setWorkout(JSON.parse(savedWorkout));
    } else {
      router.push("/custom-workout/for-time");
    }
  }, [router]);

  // Timer logic (counting up)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      if (!hasAnnouncedStart) {
        speak("Let's Go");
        setHasAnnouncedStart(true);
      }
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime > 0 && (prevTime + 1) % 60 === 0) {
            const minutes = Math.floor((prevTime + 1) / 60);
            speak(`${minutes} minute${minutes > 1 ? "s" : ""}`);
          }
          return prevTime + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, hasAnnouncedStart]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

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

  const handleSave = async () => {
    console.log("Saving For Time workout...");
    setShowSummary(false);
    if (!workout) return;
    const workoutToSave = mapForTimeWorkoutForSaving(workout, time);
    console.log("Workout to save:", workoutToSave);
    try {
      const response = await fetch("/api/workouts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workoutToSave),
      });
      if (!response.ok) throw new Error("Failed to save workout");
      alert("Workout saved successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout. Please try again.");
    }
  };

  if (!workout) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/custom-workout/for-time"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => {
              localStorage.removeItem("currentForTimeWorkout");
              window.speechSynthesis.cancel();
            }}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Exit Workout
          </Link>
          <button
            onClick={handleComplete}
            className="flex items-center text-red-500 hover:text-red-600 transition-colors"
          >
            End Workout
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-center">{workout.name}</h1>

        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold mb-4">
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
              formatTime(time)
            )}
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
              className={`p-2 rounded-lg ${
                isAudioEnabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              } text-white transition-colors`}
              title={isAudioEnabled ? "Disable Audio" : "Enable Audio"}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="bg-white/50 rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {workout.rounds > 1 ? `${workout.rounds} Rounds For Time:` : "For Time:"}
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="flex items-center justify-between">
                <div>
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
              </div>
            ))}
          </div>
        </div>

        <WorkoutSummary
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          onSave={handleSave}
          onShare={async () => { /* ... */ }}
          workout={{
            name: workout.name,
            type: "FOR TIME",
            exercises: JSON.stringify(workout.exercises),
          }}
          duration={time}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  );
}

