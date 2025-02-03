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
  rounds: number
  exercises: Exercise[]
}

export default function ForTimeWorkout() {
  const router = useRouter()
  const [workout, setWorkout] = useState<ForTimeWorkout>({
    name: "",
    rounds: 1,
    exercises: []
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<GymExercise[]>([])
  const [currentExercise, setCurrentExercise] = useState("")
  const [exercises, setExercises] = useState<GymExercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<GymExercise | null>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)

  // Load exercises on mount
  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(error => console.error('Error loading exercises:', error))
  }, [])

  // Add useEffect for handling clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  const handleExerciseInput = (value: string, exerciseId: string) => {
    setCurrentExercise(value)
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

  // Add keyboard event handler
  const handleKeyDown = (event: React.KeyboardEvent, exerciseId: string) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const addExercise = (exercise?: GymExercise) => {
    if (exercise || currentExercise.trim()) {
      setWorkout(prev => ({
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            id: Date.now().toString(),
            name: exercise ? exercise.name : currentExercise.trim(),
            metric: 'reps',
            difficulty: exercise?.difficulty,
            equipment: exercise?.equipment,
            muscle: exercise?.muscle
          }
        ]
      }))
      setCurrentExercise("")
      setSelectedExercise(null)
      setShowSuggestions(false)
    }
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

  const startWorkout = () => {
    if (workout.exercises.length === 0) return
    localStorage.setItem('currentForTimeWorkout', JSON.stringify(workout))
    router.push('/custom-workout/for-time/session')
  }

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

        {/* Updated Rounds Selection */}
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

        {/* Exercise Input with Enhanced Autocomplete */}
        <div className="relative mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentExercise}
              onChange={(e) => handleExerciseInput(e.target.value, '')}
              onKeyDown={(e) => handleKeyDown(e, '')}
              placeholder="Search exercises..."
              className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              autoComplete="off"
            />
            <button
              onClick={() => addExercise()}
              className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <Plus className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Enhanced Suggestions Dropdown */}
          {showSuggestions && (
            <div 
              ref={suggestionRef}
              className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-80 overflow-y-auto"
            >
              {suggestions.map((exercise, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleExerciseInput(exercise.name!, '')
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{exercise.muscle}</span>
                    {exercise.difficulty && (
                      <>
                        <span>•</span>
                        <span>{exercise.difficulty}</span>
                      </>
                    )}
                    {exercise.equipment && (
                      <>
                        <span>•</span>
                        <span>{exercise.equipment}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Exercise List with Details */}
        <div className="space-y-2">
          {workout.exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="bg-white p-4 rounded-xl border border-gray-200 space-y-3"
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between">
                <span className="font-medium">{exercise.name}</span>
                <button
                  onClick={() => removeExercise(exercise.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exercise Details */}
              {exercise.muscle && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>{exercise.muscle}</span>
                  {exercise.difficulty && (
                    <>
                      <span>•</span>
                      <span>{exercise.difficulty}</span>
                    </>
                  )}
                  {exercise.equipment && (
                    <>
                      <span>•</span>
                      <span>{exercise.equipment}</span>
                    </>
                  )}
                </div>
              )}

              {/* Metric Selection and Input */}
              <div className="flex gap-4 items-center">
                <select
                  value={exercise.metric}
                  onChange={(e) => updateExercise(exercise.id, { 
                    metric: e.target.value as 'reps' | 'distance' | 'calories' 
                  })}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="reps">Reps</option>
                  <option value="distance">Distance</option>
                  <option value="calories">Calories</option>
                </select>

                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    placeholder={`Enter ${exercise.metric}`}
                    value={
                      exercise.metric === 'reps' ? exercise.reps || '' :
                      exercise.metric === 'distance' ? exercise.distance || '' :
                      exercise.calories || ''
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      const updates = {
                        reps: undefined,
                        distance: undefined,
                        calories: undefined,
                        [exercise.metric]: value
                      }
                      updateExercise(exercise.id, updates)
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Weight Input */}
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="Weight (optional)"
                  value={exercise.weight || ''}
                  onChange={(e) => updateExercise(exercise.id, { 
                    weight: parseInt(e.target.value) || 0 
                  })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-12 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  kg
                </span>
              </div>

              {/* Optional Notes */}
              <input
                type="text"
                placeholder="Add notes (optional)"
                value={exercise.notes || ''}
                onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        {/* Updated Preview Section */}
        {workout.exercises.length > 0 && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white/50">
            <h2 className="text-lg font-medium mb-4">Workout Preview</h2>
            <div className="space-y-2 text-gray-600">
              <p className="font-medium text-gray-900">{workout.name || "Unnamed Workout"}</p>
              <p>{workout.rounds > 1 ? `${workout.rounds} Rounds for Time:` : "For Time:"}</p>
              {workout.exercises.map((exercise, index) => (
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
            <div className="container max-w-md mx-auto grid grid-cols-2 gap-3">
                <button className="px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600">
                    <Save className="w-4 h-4" />
                    Save
                </button>
                <button
                    onClick={startWorkout}
                    disabled={workout.exercises.length === 0}
                    className="px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play className="w-4 h-4" />
                    Start
                </button>
            </div>
        </div>
      </main>
    </div>
  )
} 