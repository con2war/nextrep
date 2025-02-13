"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Play, Trash2, Save, ChevronLeft, Timer, X, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { GymExercise } from "@/app/utils/exercises-loader"

interface Exercise {
  id: string
  name: string
  reps?: number
  weight?: number
  distance?: number
  calories?: number
  notes?: string
  metric: 'reps' | 'distance' | 'calories'
  difficulty?: string
  equipment?: string
  muscle?: string
}

interface ForTimeWorkout {
  name: string
  timeLimit?: number
  rounds: number
  exercises: Exercise[]
}

export default function ForTimeWorkout() {
  const router = useRouter()
  const [workout, setWorkout] = useState<ForTimeWorkout>({
    name: "",
    timeLimit: undefined,
    rounds: 1,
    exercises: []
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<GymExercise[]>([])
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<GymExercise[]>([])
  const suggestionRef = useRef<HTMLDivElement>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Load exercises on mount
  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(error => console.error('Error loading exercises:', error))
  }, [])

  const handleExerciseInput = (value: string, exerciseId: string) => {
    setCurrentExerciseId(exerciseId)
    updateExercise(exerciseId, { name: value })

    if (value.length >= 2) {
      const filtered = exercises
        .filter(ex =>
          ex.name.toLowerCase().includes(value.toLowerCase()) ||
          ex.muscle.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 3)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle keyboard event to hide suggestions
  const handleKeyDown = (event: React.KeyboardEvent, exerciseId: string) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id: Date.now().toString(),
          name: '',
          // Default metric is 'reps' with an initial value of 0.
          reps: 0,
          metric: 'reps'
        }
      ]
    })
  }

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.map(exercise =>
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
      )
    })
  }

  const removeExercise = (exerciseId: string) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.filter(exercise => exercise.id !== exerciseId)
    })
  }

  const updateRounds = (value: string) => {
    const parsedValue = value === '' ? '' : parseInt(value)
    setWorkout({
      ...workout,
      rounds: parsedValue === '' ? '' as unknown as number : Math.max(1, parsedValue || 1)
    })
  }

  // NEW: When the metric changes, reset previous metric values and initialize the new metric to 0.
  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>, exerciseId: string) => {
    const newMetric = e.target.value as 'reps' | 'distance' | 'calories'
    updateExercise(exerciseId, {
      metric: newMetric,
      // Clear out any previously set values for the other metrics.
      reps: undefined,
      distance: undefined,
      calories: undefined,
      // Initialize the new metric field with 0.
      [newMetric]: 0
    })
  }

  const handleSuggestionClick = (selectedName: string, exerciseId: string) => {
    updateExercise(exerciseId, { name: selectedName });
    setShowSuggestions(false);
    setCurrentExerciseId(null);
  };

  const startWorkout = () => {
    if (workout.exercises.length === 0) return
    localStorage.setItem('currentForTimeWorkout', JSON.stringify(workout))
    router.push('/custom-workout/for-time/session')
  }

  // Handle click outside to close suggestions.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const suggestionsContainer = document.querySelector('.suggestions-container')
      const exerciseInput = document.querySelector('.exercise-input')

      if (
        suggestionsContainer &&
        exerciseInput &&
        !suggestionsContainer.contains(event.target as Node) &&
        !exerciseInput.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setCurrentExerciseId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Add a useEffect to scroll to top when preview is shown
  useEffect(() => {
    if (showPreview) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showPreview]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link 
          href="/custom-workout"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Workout Types
        </Link>

        <h1 className="text-3xl font-bold mb-8 text-center">FOR TIME!</h1>
        
        {/* Workout Name Input */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Workout Name"
            value={workout.name}
            onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
            className="w-full p-4 rounded-lg border border-gray-200 bg-white/50 text-xl font-medium"
          />
        </div>

        {/* Rounds Input */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Number of Rounds
          </h2>
          <div className="max-w-[200px]">
            <input
              type="number"
              min="1"
              value={workout.rounds}
              onChange={(e) => updateRounds(e.target.value)}
              onBlur={() => {
                if (!workout.rounds) {
                  setWorkout({ ...workout, rounds: 1 })
                }
              }}
              className="w-full p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-all"
              placeholder="Enter rounds"
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {workout.exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <button
                  onClick={() => removeExercise(exercise.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Exercise Input with Autocomplete */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={exercise.name}
                  onChange={(e) => handleExerciseInput(e.target.value, exercise.id)}
                  onFocus={() => setCurrentExerciseId(exercise.id)}
                  onKeyDown={(e) => handleKeyDown(e, exercise.id)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 exercise-input"
                />
                
                {showSuggestions && currentExerciseId === exercise.id && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg suggestions-container"
                  >
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion.name, exercise.id)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                      >
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{suggestion.muscle}</span>
                          {suggestion.difficulty && (
                            <>
                              <span>•</span>
                              <span>{suggestion.difficulty}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exercise Details */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select
                  value={exercise.metric}
                  onChange={(e) => handleMetricChange(e, exercise.id)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                >
                  <option value="reps">Reps</option>
                  <option value="distance">Distance (m)</option>
                  <option value="calories">Calories</option>
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder={
                    exercise.metric === 'reps'
                      ? 'Target reps per interval'
                      : exercise.metric === 'distance'
                      ? 'Target distance per interval'
                      : 'Target calories per interval'
                  }
                  value={
                    exercise.metric === 'reps'
                      ? exercise.reps || ''
                      : exercise.metric === 'distance'
                      ? exercise.distance || ''
                      : exercise.calories || ''
                  }
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    updateExercise(exercise.id, {
                      [exercise.metric]: value
                    })
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Additional Exercise Details */}
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Weight (kg) - Optional"
                  value={exercise.weight || ''}
                  onChange={(e) => updateExercise(exercise.id, { weight: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={exercise.notes || ''}
                  onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          ))}

          {/* Add Exercise Button */}
          <button
            onClick={addExercise}
            className="w-full p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        </div>

        {/* Updated Preview Section */}
        {workout.exercises.length > 0 && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white/50">
            <h2 className="text-lg font-medium mb-4">Workout Preview</h2>
            <div className="space-y-2 text-gray-600">
              <p className="font-medium text-gray-900">{workout.name || "Unnamed Workout"}</p>
              <p>{workout.rounds > 1 ? `${workout.rounds} Rounds for Time:` : "For Time:"}</p>
              {workout.exercises.map((exercise) => (
                <p key={exercise.id}>
                  {exercise.metric === 'reps' && exercise.reps ? `${exercise.reps} reps` :
                  exercise.metric === 'distance' && exercise.distance ? `${exercise.distance}m` :
                  exercise.metric === 'calories' && exercise.calories ? `${exercise.calories} cals`
                  : ''} of {exercise.name}
                  {exercise.weight ? ` (${exercise.weight}kg)` : ""}
                  {exercise.notes ? ` - ${exercise.notes}` : ""}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
          <div className="container max-w-md mx-auto flex gap-4">
            <Link
              href="/custom-workout"
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-center hover:border-gray-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={startWorkout}
              disabled={workout.exercises.length === 0}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Start Workout
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
