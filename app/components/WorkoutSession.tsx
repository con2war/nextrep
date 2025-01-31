'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X, Plus, Minus, Pause, Play } from 'lucide-react'
import Image from 'next/image'

interface Exercise {
  exercise: string
  sets?: number
  reps?: string | number
  duration?: string
  rest?: string
  notes?: string
  type?: string
  completed?: number
  weight?: number
}

interface WorkoutData {
  warmup: Exercise[]
  mainWorkout: Exercise[]
  cooldown: Exercise[]
  duration: string
  difficulty: string
  targetMuscles: string[]
  type: string
  exercises?: {
    warmup: Exercise[]
    mainWorkout: Exercise[]
    cooldown: Exercise[]
  }
}

type ExerciseSection = 'warmup' | 'mainWorkout' | 'cooldown';

interface ExercisesState {
  warmup: Exercise[];
  mainWorkout: Exercise[];
  cooldown: Exercise[];
}

export default function WorkoutSession({ 
  workout, 
  onComplete 
}: { 
  workout: WorkoutData
  onComplete: (summary: any) => void 
}) {
  const [timer, setTimer] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  // Initialize exercises from the workout data
  const [exercises, setExercises] = useState(() => {
    const workoutExercises = workout.exercises || workout;
    
    return {
      warmup: (workoutExercises.warmup || []).map((ex: Exercise) => ({
        ...ex,
        completed: ex.completed || 0,
        weight: ex.weight || 0
      })),
      mainWorkout: (workoutExercises.mainWorkout || []).map((ex: Exercise) => ({
        ...ex,
        completed: ex.completed || 0,
        weight: ex.weight || 0
      })),
      cooldown: (workoutExercises.cooldown || []).map((ex: Exercise) => ({
        ...ex,
        completed: ex.completed || 0,
        weight: ex.weight || 0
      }))
    };
  });

  // Updated Timer useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSetComplete = (section: ExerciseSection, exerciseIndex: number) => {
    setExercises(prev => ({
      ...prev,
      [section]: prev[section].map((ex, i) => {
        if (i === exerciseIndex && (ex.completed || 0) < (ex.sets || 0)) {
          return {
            ...ex,
            completed: (ex.completed || 0) + 1
          };
        }
        return ex;
      })
    }));
  };

  const handleWeightChange = (section: ExerciseSection, exerciseIndex: number, change: number) => {
    setExercises(prev => ({
      ...prev,
      [section]: prev[section].map((ex, i) => 
        i === exerciseIndex
          ? { ...ex, weight: Math.max(0, (ex.weight || 0) + change) }
          : ex
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Timer Section */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-blue-100 shadow-sm p-4 mb-6">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logo.svg"
              alt="NextRep AI Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-blue-900">{formatTime(timer)}</span>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2.5 rounded-full hover:bg-blue-50 transition-colors"
              >
                {isPaused ? (
                  <Play className="w-5 h-5 text-blue-600" />
                ) : (
                  <Pause className="w-5 h-5 text-blue-400" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              const summary = {
                duration: formatTime(timer),
                exercises
              }
              onComplete(summary)
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Show pause overlay when workout is paused */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center max-w-sm mx-4 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Workout Paused</h3>
            <p className="text-gray-600 mb-6">Take the time you need. Your progress is saved.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="flex items-center justify-center gap-2 w-full bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Play className="w-5 h-5" />
              Resume Workout
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4">
        {Object.entries(exercises).map(([section, sectionExercises]) => (
          <section key={section} className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {section.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <div className="space-y-3">
              {sectionExercises.map((exercise: Exercise, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{exercise.exercise}</h4>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {exercise.sets && (
                          <span className="text-sm text-gray-600">
                            {exercise.sets} sets
                          </span>
                        )}
                        {exercise.reps && (
                          <span className="text-sm text-gray-600">
                            {exercise.reps} reps
                          </span>
                        )}
                        {exercise.duration && (
                          <span className="text-sm text-gray-600">
                            {exercise.duration}
                          </span>
                        )}
                        {exercise.rest && (
                          <span className="text-sm text-gray-600">
                            Rest: {exercise.rest}
                          </span>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className="text-sm text-gray-500 mt-2">{exercise.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {exercise.sets && (
                        <span className={`text-sm font-medium ${
                          exercise.completed === exercise.sets 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }`}>
                          {exercise.completed || 0}/{exercise.sets}
                        </span>
                      )}
                      <button
                        onClick={() => handleSetComplete(section as ExerciseSection, index)}
                        className={`p-2 rounded-full transition-colors ${
                          exercise.completed === exercise.sets
                            ? 'hover:bg-green-50'
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <CheckCircle 
                          className={`w-5 h-5 ${
                            exercise.completed === exercise.sets 
                              ? 'text-green-500 fill-green-500' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </button>
                    </div>
                  </div>
                  {exercise.type !== 'bodyweight' && (
                    <div className="flex items-center gap-2 mt-3 bg-gray-50 rounded-md p-2">
                      <button
                        onClick={() => handleWeightChange(section as ExerciseSection, index, -2.5)}
                        className="p-1 rounded hover:bg-white transition-colors text-gray-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 min-w-[50px] text-center">
                        {exercise.weight}kg
                      </span>
                      <button
                        onClick={() => handleWeightChange(section as ExerciseSection, index, 2.5)}
                        className="p-1 rounded hover:bg-white transition-colors text-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* End Workout Button */}
        <button
          onClick={() => {
            const summary = {
              duration: formatTime(timer),
              exercises
            }
            onComplete(summary)
          }}
          className="fixed bottom-8 left-4 right-4 max-w-2xl mx-auto bg-rose-500 text-white font-medium p-4 rounded-xl hover:bg-rose-600 transition-all shadow-lg"
        >
          End Workout
        </button>
      </div>
    </div>
  )
} 