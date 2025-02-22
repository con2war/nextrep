"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect } from "react";
import {
  Loader2,
  Calendar,
  Clock,
  Dumbbell,
  Star,
  Heart,
  Play,
  X,
  Trophy,
  Activity,
  Target,
  Flame,
  BarChart2,
  ChevronDown
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

// Helper function to format a duration (in seconds) as mm:ss.
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Helper to normalize numeric fields in non-DAILY workouts' exercises.
const normalizeExercises = (exercisesInput: any): any[] => {
  let exercisesArray: any[] = [];
  if (typeof exercisesInput === "string") {
    try {
      exercisesArray = JSON.parse(exercisesInput);
    } catch (error) {
      console.error("Error parsing exercises JSON:", error);
    }
  } else if (Array.isArray(exercisesInput)) {
    exercisesArray = exercisesInput;
  }
  return exercisesArray.map((ex: any) => ({
    ...ex,
    // If reps is a string that doesn't convert to a number, keep the string
    reps: typeof ex.reps === "string" && isNaN(Number(ex.reps))
      ? ex.reps
      : Number(ex.reps) || 0,
    distance: Number(ex.distance) || 0,
    calories: Number(ex.calories) || 0,
    weight: Number(ex.weight) || 0,
  }));
};

// Helper to normalize DAILY workout sections.
const normalizeDailyExercises = (exercises: any[]): any[] => {
  return exercises.map((ex: any) => ({
    ...ex,
    reps: typeof ex.reps === "string" && isNaN(Number(ex.reps))
      ? ex.reps
      : Number(ex.reps) || 0,
    distance: Number(ex.distance) || 0,
    calories: Number(ex.calories) || 0,
    weight: Number(ex.weight) || 0,
  }));
};


//
// Interface for a saved workout, including unique fields for different workout types.
//
interface SavedWorkout {
  id: string;
  type: "AMRAP" | "EMOM" | "TABATA" | "FOR TIME" | "DAILY";
  name?: string;
  duration: string;
  difficulty: string;
  targetMuscles: string[];
  createdAt: string;
  exercises: any; // could be a JSON string or an array
  // For DAILY workouts (structured exercises)
  warmup?: any[];
  mainWorkout?: any[];
  cooldown?: any[];
  // Unique fields for EMOM (and similar)
  intervalTime?: number;
  roundsPerMovement?: number;
  // Unique fields for TABATA:
  workTime?: number;
  restTime?: number;
  rounds?: number;
  // Unique field for AMRAP:
  timeCap?: number;
}

interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  totalMinutes: number;
  averageRating: string;
  favoriteWorkouts: number;
  recentWorkouts: {
    date: string;
    name: string;
    duration: string;
    difficulty: string;
    targetMuscles: string[];
  }[];
  personalBests: {
    longestWorkout: {
      duration: string;
      type: string;
      date: string;
    };
    highestRated: {
      rating: string;
      type: string;
      date: string;
    };
    longestStreak: number;
  };
  workoutsByType: Record<string, number>;
  mostUsedMuscleGroups: {
    muscle: string;
    count: number;
  }[];
  weeklyActivity: {
    week: string;
    workouts: number;
    minutes: number;
  }[];
  bestRatedWorkouts: {
    type: string;
    date: string;
    rating: string;
  }[];
}

// Helper function to format workout type
const formatWorkoutName = (workout: SavedWorkout) => {
  if (workout.name) return workout.name;
  
  // Format the workout type
  switch (workout.type) {
    case "FOR TIME":
      return "For Time";
    case "DAILY":
      return "Daily Workout";
    default:
      return workout.type;
  }
};

// Helper function to format duration string to minutes
const formatDurationToMinutes = (duration: string) => {
  // If duration is already in the format "X mins" or "X min", return as is
  if (duration.includes('min')) return duration;
  
  // If duration is in seconds (number string)
  const seconds = parseInt(duration);
  if (!isNaN(seconds)) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  }
  
  return duration; // fallback to original string if format is unknown
};

export default function Profile() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "favorites">("overview");
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch saved workouts and user stats when the user is logged in.
  useEffect(() => {
    const fetchSavedWorkouts = async () => {
      try {
        const response = await fetch("/api/workouts/favorites");
        if (!response.ok) throw new Error("Failed to fetch favourites");
        const data = await response.json();
        setSavedWorkouts(data);
      } catch (error) {
        console.error("Error fetching favourites:", error);
      }
    };

    const fetchUserStats = async () => {
      try {
        const response = await fetch("/api/user/stats");
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched user stats:", data); // Debug log
        setUserStats(data);
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    if (user) {
      fetchSavedWorkouts();
      fetchUserStats();
    }
  }, [user]);

  // Add debug log for render
  console.log("Current userStats:", userStats);

  // Handler when a saved workout is clicked.
  const handleWorkoutClick = (workout: any) => {
    if (!workout) {
      console.error("Invalid favorite workout data:", workout);
      return;
    }
    console.log("Selected workout data:", workout);

    if (workout.type === "DAILY") {
      // For DAILY workouts, parse exercises if needed and normalize each section.
      let parsedExercises = workout.exercises;
      if (typeof parsedExercises === "string") {
        try {
          parsedExercises = JSON.parse(parsedExercises);
        } catch (error) {
          console.error("Error parsing exercises:", error);
          parsedExercises = {};
        }
      }
      const structuredWorkout = {
        ...workout,
        warmup: workout.warmup ? normalizeDailyExercises(workout.warmup) : [],
        mainWorkout: workout.mainWorkout ? normalizeDailyExercises(workout.mainWorkout) : [],
        cooldown: workout.cooldown ? normalizeDailyExercises(workout.cooldown) : [],
        exercises: parsedExercises,
      };
      console.log("Structured DAILY workout:", structuredWorkout);
      setSelectedWorkout(structuredWorkout);
    } else {
      // For non-DAILY workouts, parse and normalize the exercises.
      const normalized = normalizeExercises(workout.exercises);
      const structuredWorkout = {
        ...workout,
        exercises: normalized,
        ...(workout.type === "TABATA" && {
          workTime: Number(workout.workTime || 0),
          restTime: Number(workout.restTime || 0),
          rounds: Number(workout.rounds || 0),
        }),
        ...(workout.type === "EMOM" && {
          roundsPerMovement: Number(workout.roundsPerMovement || 0),
          intervalTime: Number(workout.intervalTime || 0),
        }),
        ...(workout.type === "AMRAP" && {
          timeCap: Number(workout.timeCap || 0),
        }),
      };
      console.log("Structured workout:", structuredWorkout);
      setSelectedWorkout(structuredWorkout);
    }
    setIsModalOpen(true);
  };

  // Format and save the workout data, then navigate to the proper session page.
  const handleStartWorkout = (workout: SavedWorkout) => {
    try {
      const formattedWorkout = {
        id: workout.id,
        name: workout.name || workout.type,
        type: workout.type,
        duration: workout.duration,
        difficulty: workout.difficulty,
        targetMuscles: workout.targetMuscles,
        exercises: workout.exercises,
        warmup: workout.warmup,
        mainWorkout: workout.mainWorkout,
        cooldown: workout.cooldown,
        intervalTime: workout.intervalTime ?? 0,
        roundsPerMovement: workout.roundsPerMovement ?? 0,
        workTime: workout.workTime ?? 0,
        restTime: workout.restTime ?? 0,
        rounds: workout.rounds ?? 0,
      };
      if (workout.type === "DAILY") {
        formattedWorkout.exercises = {
          warmup: workout.warmup || [],
          mainWorkout: workout.mainWorkout || [],
          cooldown: workout.cooldown || [],
        };
      }
      localStorage.setItem("selectedWorkout", JSON.stringify(formattedWorkout));

      if (workout.type === "EMOM") {
        router.push("custom-workout/emom/session");
      } else if (workout.type === "AMRAP") {
        router.push("custom-workout/amrap/session");
      } else if (workout.type === "TABATA") {
        router.push("custom-workout/tabata/session");
      } else if (workout.type === "FOR TIME") {
        router.push("custom-workout/for-time/session");
      } else {
        router.push("/daily-workout");
      }
    } catch (error) {
      console.error("Error starting workout:", error);
      alert("Error loading workout. Please try again.");
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workouts/favorites/${workoutId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete workout");
      }
      setSavedWorkouts(savedWorkouts.filter((w) => w.id !== workoutId));
    } catch (error) {
      console.error("Error deleting workout:", error);
      alert("Failed to delete workout. Please try again.");
    }
  };

  const handleDeleteAllWorkouts = async () => {
    try {
      if (
        !confirm(
          "Are you sure you want to delete ALL favourited workouts? This cannot be undone."
        )
      ) {
        return;
      }
      const response = await fetch("/api/workouts/favorites/delete-all", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete all workouts");
      }
      setSavedWorkouts([]);
    } catch (error) {
      console.error("Error deleting all workouts:", error);
      alert("Failed to delete all workouts. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          {error.message}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Track Your Fitness Journey
            </h1>
            <p className="text-xl text-gray-600">
              Sign in to unlock personalized features
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Save Favourites
              </h3>
              <p className="text-gray-600">
                Keep track of your preferred workouts and access them anytime
              </p>
            </div>
          </div>
          <div className="text-center">
            <a
              href="/api/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-blue-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logo.png"
              alt="NextRep AI Logo"
              width={50}
              height={50}
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              {user?.email && (
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-blue-100">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 relative ${
                activeTab === "overview"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Overview
              {activeTab === "overview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`py-4 px-1 relative ${
                activeTab === "favorites"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Favourites
              {activeTab === "favorites" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {activeTab === "overview" ? (
          <>
            {/* Basic Stats Overview */}
            <div className="mb-8">
              {/* Streak Card */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-6 shadow-lg">
                <div className="flex flex-col items-center text-white">
                  <div className="bg-white/20 rounded-full p-4 mb-4">
                    <Flame className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-medium opacity-90 mb-1">Current Streak</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold">{userStats?.currentStreak ?? 0}</span>
                    <span className="text-2xl opacity-90">days</span>
                  </div>
                  {(userStats?.currentStreak ?? 0) > 0 && (
                    <p className="mt-2 text-sm opacity-75">
                      Keep up the great work! 💪
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Workouts Card */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-4xl font-bold text-blue-600">
                      {userStats?.totalWorkouts || 0}
                    </span>
                  </div>
                  <h3 className="text-gray-600 font-medium">Total Workouts</h3>
                  <div className="mt-2 h-2 bg-blue-100 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((userStats?.totalWorkouts || 0) / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Total Minutes Card */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-4xl font-bold text-green-600">
                      {Math.round(userStats?.totalMinutes || 0)}
                    </span>
                  </div>
                  <h3 className="text-gray-600 font-medium">Total Minutes</h3>
                  <div className="mt-2 h-2 bg-green-100 rounded-full">
                    <div 
                      className="h-2 bg-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((userStats?.totalMinutes || 0) / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Workout Distribution */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                Workout Types
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(userStats?.workoutsByType || {}).map(([type, count]) => (
                  <div key={type} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">{type}</p>
                    <p className="text-xl font-bold text-blue-500">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Used Muscle Groups */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Most Targeted Muscles
              </h3>
              <div className="flex flex-wrap gap-2">
                {userStats?.mostUsedMuscleGroups.map((group, index) => (
                  <div 
                    key={group.muscle}
                    className="px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center gap-2"
                  >
                    <span className="font-medium text-gray-900">{group.muscle}</span>
                    <span className="text-sm text-gray-500">{group.count}x</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Weekly Activity
              </h3>
              <div className="space-y-4">
                {userStats?.weeklyActivity.map((week) => (
                  <div key={week.week} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">Week of {new Date(week.week).toLocaleDateString()}</p>
                      <p className="text-sm font-medium text-gray-900">{week.workouts} workouts</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((week.workouts / 7) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{week.minutes} minutes total</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {savedWorkouts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No saved workouts yet
              </div>
            ) : (
              savedWorkouts
                .slice(0, displayCount)
                .map((workout) => (
                  <div
                    key={workout.id}
                    className="relative w-full p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-blue-200 transition-colors group"
                  >
                    <div onClick={() => handleWorkoutClick(workout)} className="cursor-pointer">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">{formatWorkoutName(workout)}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(workout.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      
                      {/* Workout Type Specific Details */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Duration: {formatDurationToMinutes(workout.duration)}</span>
                        </div>
                        
                        {workout.type === "EMOM" && (
                          <div className="text-sm text-gray-600">
                            {workout.roundsPerMovement} rounds • {workout.intervalTime}s intervals
                          </div>
                        )}
                        
                        {workout.type === "TABATA" && (
                          <div className="text-sm text-gray-600">
                            {workout.rounds} rounds • {workout.workTime}s work • {workout.restTime}s rest
                          </div>
                        )}
                        
                        {workout.type === "AMRAP" && (
                          <div className="text-sm text-gray-600">
                            {workout.timeCap} minute time cap
                          </div>
                        )}
                        
                        {workout.type === "FOR TIME" && (
                          <div className="text-sm text-gray-600">
                            Complete for time
                          </div>
                        )}
                        
                        {workout.type === "DAILY" && (
                          <div className="text-sm text-gray-600">
                            {workout.exercises.warmup?.length || 0} warm up •{" "}
                            {workout.exercises.mainWorkout?.length || 0} main •{" "}
                            {workout.exercises.cooldown?.length || 0} cool down
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {workout.targetMuscles.map((muscle, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this workout?")) {
                          handleDeleteWorkout(workout.id);
                        }
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))
            )}

            {/* Load More Button */}
            {displayCount < savedWorkouts.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={async () => {
                    setIsLoadingMore(true);
                    // Simulate loading delay
                    await new Promise(resolve => setTimeout(resolve, 300));
                    setDisplayCount(prev => prev + 5);
                    setIsLoadingMore(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* No Favorites Message */}
            {savedWorkouts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No favorite workouts yet.</p>
                <Link 
                  href="/daily-workout" 
                  className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Find workouts to favorite
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Detailed Workout Info */}
      {isModalOpen && selectedWorkout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-center">Workout Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {formatWorkoutName(selectedWorkout)}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedWorkout.type} Workout</p>
                  {selectedWorkout.difficulty && (
                    <p className="text-sm text-gray-500">
                      Difficulty: {selectedWorkout.difficulty}
                    </p>
                  )}
                </div>
                {selectedWorkout.type === "DAILY" ? (
                  <>
                    {selectedWorkout.warmup && selectedWorkout.warmup.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Warm Up</h3>
                        <ul className="space-y-2">
                          {selectedWorkout.warmup.map((exercise, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{exercise.exercise}</span>
                              {exercise.sets && (
                                <span className="text-gray-500"> • {exercise.sets} sets</span>
                              )}
                              {exercise.duration && (
                                <span className="text-gray-500"> • {exercise.duration}</span>
                              )}
                              {exercise.reps !== undefined && (
                                <span className="text-gray-500"> • {exercise.reps} reps</span>
                              )}
                              {exercise.weight ? (
                                <span className="text-gray-500"> • Weight: {exercise.weight} kg</span>
                              ) : null}
                              {exercise.notes && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {exercise.notes}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedWorkout.mainWorkout && selectedWorkout.mainWorkout.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Main Workout</h3>
                        <ul className="space-y-2">
                          {selectedWorkout.mainWorkout.map((exercise, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{exercise.exercise}</span>
                              {exercise.sets && (
                                <span className="text-gray-500"> • {exercise.sets} sets</span>
                              )}
                              {exercise.reps !== undefined && (
                                <span className="text-gray-500"> • {exercise.reps} reps</span>
                              )}
                              {exercise.duration && (
                                <span className="text-gray-500"> • {exercise.duration}</span>
                              )}
                              {exercise.rest && (
                                <span className="text-gray-500"> • Rest: {exercise.rest}</span>
                              )}
                              {exercise.weight ? (
                                <span className="text-gray-500"> • Weight: {exercise.weight} kg</span>
                              ) : null}
                              {exercise.notes && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {exercise.notes}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedWorkout.cooldown && selectedWorkout.cooldown.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Cool Down</h3>
                        <ul className="space-y-2">
                          {selectedWorkout.cooldown.map((exercise, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{exercise.exercise}</span>
                              {exercise.duration && (
                                <span className="text-gray-500"> • {exercise.duration}</span>
                              )}
                              {exercise.reps !== undefined && (
                                <span className="text-gray-500"> • {exercise.reps} reps</span>
                              )}
                              {exercise.weight ? (
                                <span className="text-gray-500"> • Weight: {exercise.weight} kg</span>
                              ) : null}
                              {exercise.notes && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {exercise.notes}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <h3 className="font-medium mb-2">Exercises</h3>
                    {(() => {
                      const exercisesData = normalizeExercises(selectedWorkout.exercises);
                      return exercisesData.length > 0 ? (
                        <ul className="space-y-2">
                          {exercisesData.map((exercise, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">
                                {exercise.name || exercise.exercise}
                              </span>
                              {exercise.metric && (
                                <span className="text-gray-500">
                                  {" "}
                                  •{" "}
                                  {exercise.metric === "reps" && exercise.reps !== undefined
                                    ? `${exercise.reps} reps`
                                    : exercise.metric === "distance" && exercise.distance !== undefined
                                    ? `${exercise.distance} m`
                                    : exercise.metric === "calories" && exercise.calories !== undefined
                                    ? `${exercise.calories} cals`
                                    : ""}
                                </span>
                              )}
                              {exercise.weight !== undefined && exercise.weight !== 0 ? (
                                <span className="text-gray-500">
                                  {" "}
                                  • Weight: {exercise.weight} kg
                                </span>
                              ) : null}
                              {exercise.sets !== undefined && (
                                <span className="text-gray-500">
                                  {" "}
                                  • {exercise.sets} sets
                                </span>
                              )}
                              {exercise.duration && (
                                <span className="text-gray-500">
                                  {" "}
                                  • {exercise.duration}
                                </span>
                              )}
                              {exercise.rest && (
                                <span className="text-gray-500">
                                  {" "}
                                  • Rest: {exercise.rest}
                                </span>
                              )}
                              {exercise.notes && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {exercise.notes}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400">No exercise details available</p>
                      );
                    })()}
                  </div>
                )}

                {selectedWorkout.type === "TABATA" && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Tabata Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Work Time</p>
                        <p className="font-medium">{selectedWorkout.workTime}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rest Time</p>
                        <p className="font-medium">{selectedWorkout.restTime}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rounds</p>
                        <p className="font-medium">{selectedWorkout.rounds}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedWorkout.type === "EMOM" && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">EMOM Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Rounds Per Movement</p>
                        <p className="font-medium">{selectedWorkout.roundsPerMovement}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Interval Time</p>
                        <p className="font-medium">{selectedWorkout.intervalTime}s</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedWorkout.type === "AMRAP" && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">AMRAP Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Time Cap</p>
                        <p className="font-medium">{selectedWorkout.timeCap}mins</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-lg font-medium">
                      {formatDuration(Number(selectedWorkout.duration))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-lg font-medium">
                      {formatDistanceToNow(new Date(selectedWorkout.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {selectedWorkout.targetMuscles && selectedWorkout.targetMuscles.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Target Muscles</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWorkout.targetMuscles.map((muscle, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  handleStartWorkout(selectedWorkout);
                }}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Workout
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Remove this workout from favourites?")) {
                    handleDeleteWorkout(selectedWorkout.id);
                    setIsModalOpen(false);
                  }
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 p-4 text-red-500 hover:text-red-600 transition-colors"
              >
                <Heart className="w-5 h-5 fill-current" />
                Remove from Favourites
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Button */}
      <div className="max-w-2xl mx-auto px-4 py-8 border-t border-gray-100">
        <a
          href="/api/auth/logout"
          className="block w-full text-center bg-rose-500 text-white font-medium px-6 py-3 rounded-lg hover:bg-rose-600 transition-colors"
        >
          Sign Out
        </a>
      </div>
    </div>
  );
}
