"use client"

import { useState, useEffect } from "react"
import { Plus, Play, Trash2, Save, ChevronLeft, Timer, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Exercise {
  id: string
  name: string
  reps?: number
  weight?: number
  distance?: number
  calories?: number
  notes?: string
  metric: 'reps' | 'distance' | 'calories'
}

interface GymExercise {
    name: string
    type: string
    equipment: string
    difficulty: string
    muscle: string
    description: string
}

interface AmrapWorkout {
    name: string
    timeCap: number
    exercises: Exercise[]
    timer: number
}

export default function AmrapWorkout() {
  const router = useRouter()
  const [workout, setWorkout] = useState<AmrapWorkout>({
    name: "",
    timeCap: 0,
    exercises: [],
    timer: 0
  })

  // Exercise suggestion states
  const [exercises, setExercises] = useState<GymExercise[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<GymExercise[]>([])
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null)

  const updateTimeCap = (value: string) => {
    const parsedValue = value === '' ? '' : parseInt(value)
    setWorkout({ 
      ...workout, 
      timeCap: parsedValue === '' ? '' as unknown as number : Math.max(1, parsedValue || 1)
    })
  }

  const timeOptions = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' }
  ]

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, {
        id: Date.now().toString(),
        name: '',
        reps: 10,
        metric: 'reps'
      }]
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

  const startWorkout = () => {
    // Convert timeCap from minutes to seconds for the timer
    const workoutToSave = {
      ...workout,
      timer: workout.timeCap * 60  // Convert minutes to seconds
    }

    // Store workout in localStorage
    localStorage.setItem('currentAmrapWorkout', JSON.stringify(workoutToSave))

    // Navigate to session page
    router.push('/custom-workout/amrap/session')
  }

  // Fetch exercises from CSV
  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(error => console.error('Error fetching exercises:', error))
  }, [])

  const handleExerciseInput = (value: string, exerciseId: string) => {
    // Update the exercise name as user types
    updateExercise(exerciseId, { name: value })
    setCurrentExerciseId(exerciseId)
    
    // Show suggestions if we have 2 or more characters
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

  const handleSuggestionClick = (selectedName: string, exerciseId: string) => {
    console.log('Selecting exercise:', selectedName) // Debug log
    updateExercise(exerciseId, { name: selectedName })
    setShowSuggestions(false)
    setCurrentExerciseId(null)
  }

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const suggestionsContainer = document.querySelector('.suggestions-container')
      const exerciseInput = document.querySelector('.exercise-input')

      if (suggestionsContainer && exerciseInput && 
        !suggestionsContainer.contains(event.target as Node) &&
        !exerciseInput.contains(event.target as Node)) {
        setShowSuggestions(false)
        setCurrentExerciseId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

        <h1 className="text-3xl font-bold mb-8 text-center">As many rounds as possible!</h1>
        
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

        {/* Updated Time Cap Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Time Cap
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {timeOptions.map((time) => (
              <button
                key={time.value}
                onClick={() => setWorkout({ ...workout, timeCap: time.value })}
                className={`p-3 rounded-lg border transition-all ${
                  workout.timeCap === time.value
                    ? 'border-blue-500 bg-blue-50/5'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/5'
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <div className="max-w-[200px]">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={workout.timeCap}
                  onChange={(e) => updateTimeCap(e.target.value)}
                  onBlur={() => {
                    if (!workout.timeCap) {
                      setWorkout({ ...workout, timeCap: 1 })
                    }
                  }}
                  className="w-full p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-all"
                  placeholder="Custom time cap"
                />
                <span className="text-gray-500">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Exercises</h2>
            <span className="text-sm text-gray-500">
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </span>
          </div>
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
                  onChange={(e) => updateExercise(exercise.id, {
                    metric: e.target.value as 'reps' | 'distance' | 'calories'
                  })}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                >
                  <option value="reps">Reps</option>
                  <option value="distance">Distance (m)</option>
                  <option value="calories">Calories</option>
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Amount"
                  value={exercise[exercise.metric] || ''}
                  onChange={(e) => {
                    updateExercise(exercise.id, {
                      [exercise.metric]: parseInt(e.target.value)
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
                  onChange={(e) => updateExercise(exercise.id, { weight: parseInt(e.target.value) })}
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
          
          <button
            onClick={addExercise}
            className="w-full p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        </div>

        {/* Preview Section */}
        {workout.exercises.length > 0 && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white/50">
            <h2 className="text-lg font-medium mb-4">Workout Preview</h2>
            <div className="space-y-2 text-gray-600">
              <p className="font-medium text-gray-900">{workout.name || "Unnamed Workout"}</p>
              <p>{workout.timeCap} Minute AMRAP:</p>
              {workout.exercises.map((exercise, index) => (
                <p key={exercise.id}>
                  {exercise.metric === 'reps' ? `${exercise.reps} reps` :
                   exercise.metric === 'distance' ? `${exercise.distance}m` :
                   `${exercise.calories} cals`} of {exercise.name}
                  {exercise.weight ? ` (${exercise.weight}kg)` : ""}
                  {exercise.notes ? ` - ${exercise.notes}` : ""}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
          <div className="max-w-2xl mx-auto flex gap-4">
            <Link
              href="/custom-workout"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-center hover:border-gray-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={startWorkout}
              disabled={workout.exercises.length === 0 || !workout.timeCap}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
            >
              Start Workout
            </button>
          </div>
        </div>
      </main>
    </div>
  )
} 