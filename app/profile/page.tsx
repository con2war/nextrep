'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useState, useEffect } from 'react'
import {
  Loader2,
  Calendar,
  Clock,
  Dumbbell,
  Star,
  Heart,
  Play,
  X
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

//
// Helper function to format a duration (in seconds) as mm:ss.
//
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

//
// Interface for a saved workout, including unique fields for EMOM, TABATA, etc.
//
interface SavedWorkout {
  id: string
  type: 'AMRAP' | 'EMOM' | 'TABATA' | 'FOR TIME' | 'DAILY'
  name?: string
  duration: string
  difficulty: string
  targetMuscles: string[]
  createdAt: string
  exercises: any // could be a JSON string or an array
  // For DAILY workouts (structured exercises)
  warmup?: any[]
  mainWorkout?: any[]
  cooldown?: any[]
  // Unique fields for EMOM (and similar)
  intervalTime?: number
  roundsPerMovement?: number
  // Unique fields for TABATA:
  workTime?: number
  restTime?: number
  rounds?: number
  // (Add additional unique fields as needed.)
  timeCap?: number
}

interface UserStats {
  totalWorkouts: number
  currentStreak: number
  totalMinutes: number
  averageRating: string
  favoriteWorkouts: number
  recentWorkouts: {
    date: string
    name: string
    duration: string
    difficulty: string
    targetMuscles: string[]
  }[]
}

export default function Profile() {
  const { user, error, isLoading } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites'>('overview')
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  // Fetch saved workouts and user stats when the user is logged in.
  useEffect(() => {
    const fetchSavedWorkouts = async () => {
      try {
        const response = await fetch('/api/workouts/favorites')
        if (!response.ok) throw new Error('Failed to fetch favorites')
        const data = await response.json()
        setSavedWorkouts(data)
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }

    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/user/stats')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || 'Failed to fetch stats')
        }
        const data = await response.json()
        setUserStats(data)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      }
    }

    if (user) {
      fetchSavedWorkouts()
      fetchUserStats()
    }
  }, [user])

  // When a favorited workout is clicked, store it as selected and open the modal.
  const handleWorkoutClick = (workout: SavedWorkout) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

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
        // Include unique fields with fallback defaults.
        intervalTime: workout.intervalTime ?? 0,
        roundsPerMovement: workout.roundsPerMovement ?? 0,
        workTime: workout.workTime ?? 0,
        restTime: workout.restTime ?? 0,
        rounds: workout.rounds ?? 0,
      }
      localStorage.setItem('selectedWorkout', JSON.stringify(formattedWorkout))

      // If it's an EMOM workout, navigate to the EMOM session page.
      if (workout.type === 'EMOM') {
        router.push('/emom/session')
      } else {
        // For all other workout types, navigate to the standard workout session page.
        router.push('/daily-workout')
      }
    } catch (error) {
      console.error('Error starting workout:', error)
      alert('Error loading workout. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          {error.message}
        </div>
      </div>
    )
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
            {/* Example marketing card */}
            <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Favorites</h3>
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
    )
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
              {user?.email && <p className="text-sm text-gray-600 mt-1">{user.email}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-blue-100">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Overview
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 px-1 relative ${activeTab === 'favorites' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Favorites
              {activeTab === 'favorites' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {activeTab === 'overview' ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-lg border border-blue-100 bg-white">
                <p className="text-2xl font-bold text-blue-500">{userStats?.totalWorkouts || 0}</p>
                <p className="text-sm text-gray-600">Workouts</p>
              </div>
              <div className="p-4 rounded-lg border border-blue-100 bg-white">
                <p className="text-2xl font-bold text-blue-500">{userStats?.currentStreak || 0}</p>
                <p className="text-sm text-gray-600">Day Streak</p>
              </div>
              <div className="p-4 rounded-lg border border-blue-100 bg-white">
                <p className="text-2xl font-bold text-blue-500">{userStats?.totalMinutes || 0}</p>
                <p className="text-sm text-gray-600">Total Minutes</p>
              </div>
              <div className="p-4 rounded-lg border border-blue-100 bg-white">
                <p className="text-2xl font-bold text-blue-500">{userStats?.averageRating || '0.0'}</p>
                <p className="text-sm text-gray-600">Avg. Rating</p>
              </div>
            </div>

            {/* Recent Favorites */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Recently Favorited</h3>
              <div className="space-y-3">
                {userStats?.recentWorkouts && userStats.recentWorkouts.length > 0 ? (
                  userStats.recentWorkouts.map((workout, index) => (
                    <div key={index} className="p-4 rounded-lg border border-blue-100 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-700">{workout.name}</h4>
                          <p className="text-sm text-gray-500">{workout.date}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-500">{workout.duration}</span>
                          <span className="text-sm text-gray-500">{workout.difficulty}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {workout.targetMuscles.map((muscle, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No favorited workouts yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {savedWorkouts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No saved workouts yet</div>
            ) : (
              savedWorkouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => handleWorkoutClick(workout)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{workout.type}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {workout.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-4 h-4" />
                          {workout.difficulty}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(workout.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workout.targetMuscles.map((muscle, index) => (
                      <span
                        key={index}
                        className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Custom Modal: Display complete workout details with unique fields and a Start Workout button */}
      {isModalOpen && selectedWorkout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-center">Workout Details</h2>
              </div>

              <div className="space-y-4">
                {/* Basic Details */}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedWorkout.name || selectedWorkout.type}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedWorkout.type} Workout</p>
                  {selectedWorkout.difficulty && (
                    <p className="text-sm text-gray-500">Difficulty: {selectedWorkout.difficulty}</p>
                  )}
                </div>

                {/* Unique Workout Details */}
                {selectedWorkout.type === "TABATA" && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tabata Details</h3>
                    <p className="text-sm text-gray-500">
                      Work: {selectedWorkout.workTime ?? "--"}s &nbsp; Rest: {selectedWorkout.restTime ?? "--"}s
                    </p>
                    <p className="text-sm text-gray-500">
                      Rounds: {selectedWorkout.rounds ?? "--"}
                    </p>
                  </div>
                )}
                {selectedWorkout.type === "EMOM" && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">EMOM Details</h3>
                    <p className="text-sm text-gray-500">
                      Interval Time: {selectedWorkout.intervalTime ?? "--"} seconds
                    </p>
                    <p className="text-sm text-gray-500">
                      Rounds per Movement: {selectedWorkout.roundsPerMovement ?? "--"}
                    </p>
                  </div>
                )}
                {selectedWorkout.type === "AMRAP" && selectedWorkout.timeCap && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">AMRAP Details</h3>
                    <p className="text-sm text-gray-500">
                      Time Cap: {selectedWorkout.timeCap} minute{selectedWorkout.timeCap > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
                {selectedWorkout.type === "FOR TIME" && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">For Time Details</h3>
                    {/* Add any unique fields for FOR TIME workouts if applicable */}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-lg font-medium">{formatDuration(Number(selectedWorkout.duration))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-lg font-medium">
                      {formatDistanceToNow(new Date(selectedWorkout.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Target Muscles */}
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

                {/* Exercises */}
                <div>
                  <h3 className="font-medium mb-2">Exercises</h3>
                  {["EMOM", "FOR TIME", "AMRAP", "TABATA"].includes(selectedWorkout.type) ? (
                    (() => {
                      let exercisesData: any[] = []
                      if (typeof selectedWorkout.exercises === "string") {
                        try {
                          exercisesData = JSON.parse(selectedWorkout.exercises)
                        } catch (error) {
                          console.error("Error parsing exercises:", error)
                        }
                      } else if (Array.isArray(selectedWorkout.exercises)) {
                        exercisesData = selectedWorkout.exercises
                      }
                      return exercisesData.length > 0 ? (
                        <ul className="space-y-2">
                          {exercisesData.map((exercise, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{exercise.name || exercise.exercise}</span>
                              {exercise.sets && <span className="text-gray-500"> • {exercise.sets} sets</span>}
                              {exercise.reps && <span className="text-gray-500"> • {exercise.reps} reps</span>}
                              {exercise.duration && <span className="text-gray-500"> • {exercise.duration}</span>}
                              {exercise.rest && <span className="text-gray-500"> • Rest: {exercise.rest}</span>}
                              {exercise.notes && <p className="text-xs text-gray-500 mt-1 italic">{exercise.notes}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400">No exercise details available</p>
                      )
                    })()
                  ) : (
                    <p className="text-gray-400">No exercise details available</p>
                  )}
                </div>
              </div>

              {/* Single Action Button: Start Workout */}
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  handleStartWorkout(selectedWorkout)
                }}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Workout
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
  )
}
