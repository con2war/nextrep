"use client"

import { useState, useEffect } from "react"
import { Plus, Play, Trash2, Save, ChevronLeft, Timer, Clock, Repeat } from "lucide-react"
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

interface EmomWorkout {
    name: string
    intervalTime: number
    intervalUnit: 'seconds' | 'minutes'
    sets: number
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

export default function EmomWorkout() {
    const router = useRouter()
    const [workout, setWorkout] = useState<EmomWorkout>({
        name: "",
        intervalTime: 30,
        intervalUnit: 'seconds',
        sets: 1,
        exercises: []
    })
    const [exercises, setExercises] = useState<GymExercise[]>([])
    const [currentExercise, setCurrentExercise] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestions, setSuggestions] = useState<GymExercise[]>([])
    const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null)

    // Calculate total workout time based on interval time and sets
    const totalTime = workout.intervalTime * workout.sets * workout.exercises.length

    // Update interval with better handling
    const updateInterval = (value: string) => {
        const parsedValue = value === '' ? 0 : parseInt(value)
        setWorkout({
            ...workout,
            intervalTime: parsedValue
        })
    }

    // Update sets with better handling
    const updateSets = (value: string) => {
        const parsedValue = value === '' ? '' : parseInt(value)
        setWorkout({
            ...workout,
            sets: parsedValue === '' ? '' as unknown as number : Math.max(1, parsedValue || 1)
        })
    }

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

    // Format time for display
    const formatTime = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes} min`
        }
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `${hours}h ${remainingMinutes}m`
    }

    const startWorkout = () => {
        // Validate workout
        if (workout.exercises.length === 0) return
        if (!workout.intervalTime) return
        if (!workout.sets) return

        // Convert interval to seconds if needed
        const workoutToSave = {
            ...workout,
            intervalTime: workout.intervalUnit === 'minutes' ? 
                workout.intervalTime * 60 : 
                workout.intervalTime
        }

        // Store the workout in localStorage before navigating
        localStorage.setItem('currentEmomWorkout', JSON.stringify(workoutToSave))
        router.push('/custom-workout/emom/session')
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
        updateExercise(exerciseId, { name: selectedName })
        setShowSuggestions(false)
        setCurrentExerciseId(null)
    }

    // Updated click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Get the suggestions container
            const suggestionsContainer = document.querySelector('.suggestions-container')
            const exerciseInput = document.querySelector('.exercise-input')

            // Check if click is outside both the suggestions and input
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

    // Add handleKeyDown to handle Enter/Return key
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, exerciseId: string) => {
        if (event.key === 'Enter' || event.key === 'Return') {
            event.preventDefault() // Prevent any default form submission
            setShowSuggestions(false)
            setCurrentExerciseId(null)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
            <main className="container max-w-md mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="mb-8">
                    <Link
                        href="/custom-workout"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Create EMOM Workout</h1>
                </div>

                {/* Workout Name */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Workout Name"
                        value={workout.name}
                        onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
                        className="w-full px-4 py-3 text-lg rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                </div>

                {/* Interval Settings */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                    <h2 className="font-medium text-gray-900 mb-4">Interval Settings</h2>
                    <div className="space-y-4">
                        {/* Interval Time */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Interval Time</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        min="0"
                                        value={workout.intervalTime || ''}
                                        onChange={(e) => updateInterval(e.target.value)}
                                        onBlur={() => {
                                            if (!workout.intervalTime) {
                                                setWorkout({ 
                                                    ...workout, 
                                                    intervalTime: workout.intervalUnit === 'seconds' ? 30 : 1 
                                                })
                                            }
                                        }}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                                        placeholder="0"
                                    />
                                </div>
                                <select
                                    value={workout.intervalUnit}
                                    onChange={(e) => setWorkout({ 
                                        ...workout, 
                                        intervalUnit: e.target.value as 'seconds' | 'minutes',
                                        intervalTime: e.target.value === 'seconds' ? 30 : 1
                                    })}
                                    className="h-12 px-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-base font-medium min-w-[100px] appearance-none bg-no-repeat bg-[right_12px_center]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`
                                    }}
                                >
                                    <option value="seconds">Secs</option>
                                    <option value="minutes">Mins</option>
                                </select>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {workout.intervalUnit === 'seconds' ? 'Minimum: 10 seconds' : 'Minimum: 1 minute'}
                            </p>
                        </div>

                        {/* Sets */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Rounds</label>
                            <input
                                type="number"
                                min="1"
                                value={workout.sets}
                                onChange={(e) => updateSets(e.target.value)}
                                onBlur={() => {
                                    if (!workout.sets) {
                                        setWorkout({ ...workout, sets: 1 })
                                    }
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                placeholder="Enter sets"
                            />
                        </div>
                    </div>
                </div>

                {/* Exercises Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium text-gray-900">Exercises</h2>
                        <span className="text-sm text-gray-500">
                            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                        </span>
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

                                <div className="relative">
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
                                                [exercise.metric]: parseInt(e.target.value) || 0
                                            })
                                        }}
                                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>

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
                    </div>

                    {/* Add Exercise Button */}
                    <button
                        onClick={addExercise}
                        className="w-full mt-4 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                        <Plus className="w-4 h-4" />
                        Add Exercise
                    </button>
                </div>
            </main>

            {/* Action Buttons - Updated positioning and spacing */}
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
        </div>
    )
} 