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

interface TabataWorkout {
  name: string
  rounds: number // typically 8 rounds for traditional Tabata
  workInterval: number // typically 20 seconds
  restInterval: number // typically 10 seconds
  exercises: Exercise[]
}

interface GymExercise {
    name: string
    type: string
    equipment: string
    difficulty: string
    muscle: string
    description: string
}

export default function TabataWorkout() {
  const router = useRouter()
  const [workout, setWorkout] = useState<TabataWorkout>({
    name: "",
    rounds: 8,
    workInterval: 20,
    restInterval: 10,
    exercises: []
  })

  const [exercises, setExercises] = useState<GymExercise[]>([])
  const [currentExercise, setCurrentExercise] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<GymExercise[]>([])

  // Fetch exercises from API
  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(error => console.error('Error fetching exercises:', error))
  }, [])

  // Handle exercise input and suggestions
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

  // Super simple suggestion click handler - just update the exercise name
  const handleSuggestionClick = (selectedName: string, exerciseId: string) => {
    console.log('Selected:', selectedName) // Debug log
    updateExercise(exerciseId, { name: selectedName })
    setShowSuggestions(false)
  }

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Update rounds with better handling
  const updateRounds = (value: string) => {
    const parsedValue = value === '' ? '' : parseInt(value)
    setWorkout({ 
      ...workout, 
      rounds: parsedValue === '' ? '' as unknown as number : Math.max(1, parsedValue || 1)
    })
  }

  // Update work interval with better handling
  const updateWorkInterval = (value: string) => {
    const parsedValue = value === '' ? '' : parseInt(value)
    setWorkout({ 
      ...workout, 
      workInterval: parsedValue === '' ? '' as unknown as number : Math.max(5, parsedValue || 20)
    })
  }

  // Update rest interval with better handling
  const updateRestInterval = (value: string) => {
    const parsedValue = value === '' ? '' : parseInt(value)
    setWorkout({ 
      ...workout, 
      restInterval: parsedValue === '' ? '' as unknown as number : Math.max(5, parsedValue || 10)
    })
  }

  // Calculate total workout time
  const totalTime = Math.ceil(
    (workout.exercises.length * workout.rounds * (workout.workInterval + workout.restInterval)) / 60
  )

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, {
        id: Date.now().toString(),
        name: '',
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
    // Validate workout
    if (workout.exercises.length === 0) return
    if (!workout.workInterval) return
    if (!workout.restInterval) return
    if (!workout.rounds) return

    // Store the workout in localStorage before navigating
    localStorage.setItem('currentTabataWorkout', JSON.stringify(workout))
    router.push('/custom-workout/tabata/session')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link 
          href="/custom-workout"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Workout Types
        </Link>

        <h1 className="text-3xl font-bold mb-8 text-center">TABATA:</h1>
        
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

        {/* Updated Tabata Settings */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-medium mb-3">Rounds</h2>
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
            />
          </div>
          <div>
            <h2 className="text-lg font-medium mb-3">Intervals</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Work (sec)</label>
                <input
                  type="number"
                  min="5"
                  value={workout.workInterval}
                  onChange={(e) => updateWorkInterval(e.target.value)}
                  onBlur={() => {
                    if (!workout.workInterval) {
                      setWorkout({ ...workout, workInterval: 20 })
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Rest (sec)</label>
                <input
                  type="number"
                  min="5"
                  value={workout.restInterval}
                  onChange={(e) => updateRestInterval(e.target.value)}
                  onBlur={() => {
                    if (!workout.restInterval) {
                      setWorkout({ ...workout, restInterval: 10 })
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Total Time Display */}
        <div className="mb-8 p-4 rounded-lg border border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Total Workout Time:</span>
            </div>
            <span className="text-blue-600 font-bold">{totalTime} min</span>
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
              <div className="flex items-center gap-4">
                <span className="text-gray-500 font-medium">#{index + 1}</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => handleExerciseInput(e.target.value, exercise.id)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mb-3"
                  />
                  
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg">
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
                <button
                  onClick={() => removeExercise(exercise.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <select
                  value={exercise.metric}
                  onChange={(e) => updateExercise(exercise.id, { 
                    metric: e.target.value as 'reps' | 'distance' | 'calories',
                    reps: undefined,
                    distance: undefined,
                    calories: undefined
                  })}
                  className="p-2 rounded border border-gray-200"
                >
                  <option value="reps">Target Reps</option>
                  <option value="distance">Target Distance (m)</option>
                  <option value="calories">Target Calories</option>
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder={exercise.metric === 'reps' ? 'Target reps per interval' : 
                             exercise.metric === 'distance' ? 'Target distance per interval' : 
                             'Target calories per interval'}
                  value={exercise.metric === 'reps' ? exercise.reps || '' :
                         exercise.metric === 'distance' ? exercise.distance || '' :
                         exercise.calories || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    updateExercise(exercise.id, {
                      [exercise.metric]: value
                    })
                  }}
                  className="w-full p-2 rounded border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Weight (kg) - Optional</label>
                <input
                  type="number"
                  value={exercise.weight || ''}
                  onChange={(e) => updateExercise(exercise.id, { weight: parseInt(e.target.value) })}
                  className="w-full p-2 rounded border border-gray-200"
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={exercise.notes || ''}
                onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                className="w-full p-2 rounded border border-gray-200"
              />
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
              <p>{workout.rounds} rounds of:</p>
              <p className="text-sm italic">
                {workout.workInterval}s work / {workout.restInterval}s rest
              </p>
              {workout.exercises.map((exercise, index) => (
                <p key={exercise.id}>
                  {exercise.name}
                  {exercise.metric === 'reps' && exercise.reps ? ` (Target: ${exercise.reps} reps)` : ''}
                  {exercise.metric === 'distance' && exercise.distance ? ` (Target: ${exercise.distance}m)` : ''}
                  {exercise.metric === 'calories' && exercise.calories ? ` (Target: ${exercise.calories} calories)` : ''}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Updated to match other workout pages */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
          <div className="container max-w-md mx-auto grid grid-cols-2 gap-3">
            <button 
              className="px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
            >
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