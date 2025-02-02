"use client"

import { useState } from "react"
import { Plus, Play, Trash2, Save, ChevronLeft, Timer, Clock } from "lucide-react"
import Link from "next/link"

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

export default function TabataWorkout() {
  const [workout, setWorkout] = useState<TabataWorkout>({
    name: "",
    rounds: 8,
    workInterval: 20,
    restInterval: 10,
    exercises: []
  })

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
            <div key={exercise.id} className="bg-white/30 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-gray-500 font-medium">#{index + 1}</span>
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={exercise.name}
                  onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                  className="flex-grow p-2 rounded border border-gray-200"
                />
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
                  {exercise.metric === 'calories' && exercise.calories ? ` (Target: ${exercise.calories} cals)` : ''}
                  {exercise.weight ? ` (${exercise.weight}kg)` : ""}
                  {exercise.notes ? ` - ${exercise.notes}` : ""}
                </p>
              ))}
              <p className="mt-4 text-sm">Total Time: {totalTime} minutes</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all">
            <Save className="w-5 h-5" />
            Save Workout
          </button>
          <button 
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={workout.exercises.length === 0}
          >
            <Play className="w-5 h-5" />
            Start Workout
          </button>
        </div>
      </main>
    </div>
  )
} 