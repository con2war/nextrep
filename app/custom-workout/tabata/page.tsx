"use client"

import { useState, useEffect } from "react"
import { Plus, Play, Trash2, Save, ChevronLeft, Timer, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Exercise {
  id: string
  name: string
  reps?: string
  weight?: number
  distance?: string
  calories?: string
  notes?: string
  metric: 'reps' | 'distance' | 'calories'
}

interface TabataWorkout {
  name: string
  rounds: number // typically 8 rounds for traditional Tabata
  workTime: number | null
  restTime: number | null
  exercises: Exercise[]
}

interface GymExercise {
  Title: string
  "Target Muscle Group": string
  "Difficulty Level": string
  "Prime Mover Muscle": string
}

interface ExerciseSuggestion {
  name: string;
  muscle: string;
  difficulty: string;
}

export default function TabataWorkoutCreator() {
  const router = useRouter()
  const [workout, setWorkout] = useState<TabataWorkout>({
    name: "",
    rounds: 8,
    workTime: 20,
    restTime: 10,
    exercises: []
  })

  const [exercises, setExercises] = useState<GymExercise[]>([])
  const [currentExercise, setCurrentExercise] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([])
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null)

  // Fetch exercises from API
  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(error => console.error('Error fetching exercises:', error))
  }, [])

  // Handle metric value changes
  const handleMetricValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    exerciseId: string,
    metric: 'reps' | 'distance' | 'calories'
  ) => {
    const val = e.target.value;
    if (val === '' || !isNaN(Number(val))) {
      updateExercise(exerciseId, { [metric]: val });
    }
  };

  // Handle metric value blur
  const handleMetricValueBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    exerciseId: string,
    metric: 'reps' | 'distance' | 'calories'
  ) => {
    const val = e.target.value;
    if (val === "" || isNaN(Number(val))) {
      updateExercise(exerciseId, { [metric]: "" });
    } else {
      updateExercise(exerciseId, { [metric]: val });
    }
  };

  // Handle exercise input and suggestions
  const handleExerciseInput = (value: string, exerciseId: string) => {
    updateExercise(exerciseId, { name: value });
    setCurrentExerciseId(exerciseId);
    
    if (value.length >= 2) {
      const filtered = exercises
        .filter(ex => {
          if (!ex || !ex.Title || !ex["Target Muscle Group"]) return false;
          
          return (
            ex.Title.toLowerCase().includes(value.toLowerCase()) ||
            ex["Target Muscle Group"].toLowerCase().includes(value.toLowerCase())
          );
        })
        .slice(0, 3);

      const mappedSuggestions = filtered.map(ex => ({
        name: ex.Title,
        muscle: ex["Target Muscle Group"],
        difficulty: ex["Difficulty Level"]
      }));

      setSuggestions(mappedSuggestions);
      setShowSuggestions(mappedSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (selectedName: string, exerciseId: string) => {
    updateExercise(exerciseId, { name: selectedName });
    setShowSuggestions(false);
    setCurrentExerciseId(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      setShowSuggestions(false)
      setCurrentExerciseId(null)
    }
  }

  const updateRounds = (value: string) => {
    const parsedValue = value === '' ? '' : parseInt(value)
    setWorkout({
      ...workout,
      rounds: parsedValue === '' ? '' as unknown as number : Math.max(1, parsedValue || 1)
    })
  }

  // Calculate total workout time in minutes.
  const totalTime = Math.ceil(
    (workout.exercises.length * workout.rounds * ((workout.workTime ?? 0) + (workout.restTime ?? 0))) / 60
  )

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id: Date.now().toString(),
          name: '',
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

  // New: Handle metric change by resetting previous values and initializing the new metric.
  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>, exerciseId: string) => {
    const newMetric = e.target.value as 'reps' | 'distance' | 'calories'
    updateExercise(exerciseId, {
      metric: newMetric,
      reps: undefined,
      distance: undefined,
      calories: undefined,
      [newMetric]: 0, // Initialize the new metric value to 0.
    })
  }

  const startWorkout = () => {
    if (workout.exercises.length === 0) return
    if (!workout.workTime) return
    if (!workout.restTime) return
    if (!workout.rounds) return

    localStorage.setItem('currentTabataWorkout', JSON.stringify(workout))
    router.push('/custom-workout/tabata/session')
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

        {/* Work/Rest Time Inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Work Time (seconds)</label>
            <input
              type="text"
              value={workout.workTime || ''}
              onChange={(e) => {
                const value = e.target.value
                setWorkout({
                  ...workout,
                  workTime: value === '' ? null : parseInt(value)
                })
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  setWorkout(prev => ({ ...prev, workTime: 20 }))
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="20"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Rest Time (seconds)</label>
            <input
              type="text"
              value={workout.restTime || ''}
              onChange={(e) => {
                const value = e.target.value
                setWorkout({
                  ...workout,
                  restTime: value === '' ? null : parseInt(value)
                })
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  setWorkout(prev => ({ ...prev, restTime: 10 }))
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="10"
            />
          </div>
        </div>

        {/* Rounds Input */}
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
        </div>

        {/* Exercises Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Exercises</h2>
            <span className="text-sm text-gray-500">
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </span>
          </div>
          {workout.exercises.map((exercise) => (
            <div key={exercise.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => handleExerciseInput(e.target.value, exercise.id)}
                    onFocus={() => setCurrentExerciseId(exercise.id)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 exercise-input"
                  />
                  
                  {showSuggestions && currentExerciseId === exercise.id && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg suggestions-container">
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

              {/* Exercise Details */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <select
                  value={exercise.metric}
                  onChange={(e) => handleMetricChange(e, exercise.id)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                >
                  <option value="reps">Target Reps</option>
                  <option value="distance">Target Distance (m)</option>
                  <option value="calories">Target Calories</option>
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Amount"
                  value={exercise[exercise.metric] || ''}
                  onChange={(e) => handleMetricValueChange(e, exercise.id, exercise.metric)}
                  onBlur={(e) => handleMetricValueBlur(e, exercise.id, exercise.metric)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Weight and Notes inputs */}
              <div className="space-y-3 mt-3">
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
          
          <button
            onClick={addExercise}
            className="w-full p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
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

        {/* Preview Section */}
        {workout.exercises.length > 0 && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white/50">
            <h2 className="text-lg font-medium mb-4">Workout Preview</h2>
            <div className="space-y-2 text-gray-600">
              <p className="font-medium text-gray-900">{workout.name || "Unnamed Workout"}</p>
              <p>{workout.rounds} rounds of:</p>
              <p className="text-sm italic">
                {workout.workTime}s work / {workout.restTime}s rest
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

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
          <div className="container max-w-md mx-auto grid grid-cols-2 gap-3">
            <Link
              href="/custom-workout"
              className="px-4 py-3 rounded-xl border border-gray-200 text-center hover:border-gray-300 transition-colors"
            >
              Cancel
            </Link>
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
