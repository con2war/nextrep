'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useState, useEffect } from 'react'
import { Loader2, Calendar, Clock, Dumbbell, Star, Heart, Play, X } from 'lucide-react'
import Image from 'next/image'

interface SavedWorkout {
  id: string
  type: string
  duration: string
  difficulty: string
  targetMuscles: string[]
  createdAt: string
  exercises: any // Add exercises to the interface
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
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites'>('overview')
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)

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
        // Optionally show error to user
        // setError(error.message)
      }
    }

    if (user) {
      fetchSavedWorkouts()
      fetchUserStats()
    }
  }, [user])

  const handleWorkoutClick = (workout: SavedWorkout) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

  const handleStartWorkout = () => {
    if (selectedWorkout) {
      try {
        const exercises = typeof selectedWorkout.exercises === 'string'
          ? JSON.parse(selectedWorkout.exercises)
          : selectedWorkout.exercises;

        // Reset completed sets for each exercise section
        const resetExercises = {
          warmup: exercises.warmup?.map((ex: any) => ({
            ...ex,
            completed: 0
          })) || [],
          mainWorkout: exercises.mainWorkout?.map((ex: any) => ({
            ...ex,
            completed: 0
          })) || [],
          cooldown: exercises.cooldown?.map((ex: any) => ({
            ...ex,
            completed: 0
          })) || []
        };

        const formattedWorkout = {
          ...selectedWorkout,
          exercises: resetExercises,
        };

        console.log('Starting workout:', formattedWorkout);
        localStorage.setItem('selectedWorkout', JSON.stringify(formattedWorkout));
        window.location.href = '/daily-workout';
      } catch (error) {
        console.error('Error starting workout:', error);
      }
    }
  }

  const renderExercises = () => {
    if (!selectedWorkout) return null;

    try {
      const exercises = typeof selectedWorkout.exercises === 'string'
        ? JSON.parse(selectedWorkout.exercises)
        : selectedWorkout.exercises;

      if (!exercises || (!exercises.warmup && !exercises.mainWorkout && !exercises.cooldown)) {
        return <p className="text-gray-400">No exercise details available</p>;
      }

      return (
        <div className="space-y-6">
          {/* Warmup Section */}
          {exercises.warmup && exercises.warmup.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Warm-up</h4>
              <div className="space-y-2">
                {exercises.warmup.map((exercise: any, index: number) => (
                  <div key={`warmup-${index}`} className="p-3 rounded-lg border border-gray-800 bg-white-900/50">
                    <p className="font-medium">{exercise.exercise}</p>
                    <p className="text-sm text-gray-400">
                      {exercise.sets && `${exercise.sets} sets`}
                      {exercise.duration && ` • ${exercise.duration}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Workout Section */}
          {exercises.mainWorkout && exercises.mainWorkout.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Main Workout</h4>
              <div className="space-y-2">
                {exercises.mainWorkout.map((exercise: any, index: number) => (
                  <div key={`main-${index}`} className="p-3 rounded-lg border border-gray-800 bg-white-900/50">
                    <p className="font-medium">{exercise.exercise}</p>
                    <p className="text-sm text-gray-400">
                      {exercise.sets && `${exercise.sets} sets`}
                      {exercise.reps && ` × ${exercise.reps} reps`}
                      {exercise.rest && ` • ${exercise.rest} rest`}
                    </p>
                    {exercise.notes && (
                      <p className="text-sm text-gray-400 mt-1">{exercise.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cooldown Section */}
          {exercises.cooldown && exercises.cooldown.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Cool-down</h4>
              <div className="space-y-2">
                {exercises.cooldown.map((exercise: any, index: number) => (
                  <div key={`cooldown-${index}`} className="p-3 rounded-lg border border-gray-800 bg-white-900/50">
                    <p className="font-medium">{exercise.exercise}</p>
                    <p className="text-sm text-gray-400">
                      {exercise.duration && exercise.duration}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error parsing exercises:', error);
      return <p className="text-gray-400">Error loading exercise details</p>;
    }
  };

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
            <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Favorites</h3>
              <p className="text-gray-600">
                Keep track of your preferred workouts and access them anytime
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your workout history and fitness achievements
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalization</h3>
              <p className="text-gray-600">
                Get workouts tailored to your preferences and goals
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume Progress</h3>
              <p className="text-gray-600">
                Pick up where you left off with saved workout sessions
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
      {/* Header Section */}
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
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 relative ${
                activeTab === 'overview'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 px-1 relative ${
                activeTab === 'favorites'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Favorites
              {activeTab === 'favorites' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
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
                {userStats?.recentWorkouts.length ? (
                  userStats.recentWorkouts.map((workout, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg border border-blue-100 bg-white"
                    >
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
                          <span 
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600"
                          >
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
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : savedWorkouts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No saved workouts yet
              </div>
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

        {/* Workout Details Modal */}
        {isModalOpen && selectedWorkout && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedWorkout.type}</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    {selectedWorkout.duration}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Dumbbell className="w-4 h-4" />
                    {selectedWorkout.difficulty}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Target Muscles</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkout.targetMuscles.map((muscle, index) => (
                      <span
                        key={index}
                        className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Exercises</h3>
                  <div className="space-y-2">
                    {renderExercises()}
                  </div>
                </div>

                <button
                  onClick={handleStartWorkout}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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


