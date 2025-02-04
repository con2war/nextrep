"use client"

import { Share2, Save, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface WorkoutSummaryProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onShare: () => void
  workout: {
    name: string
    type: 'AMRAP' | 'EMOM' | 'TABATA' | 'FOR TIME' | 'DAILY'
    exercises: Array<{
      name: string
      reps?: number
      weight?: number
      distance?: number
      calories?: number
    }>
  }
  duration: number // in seconds
  completedAt: Date
}

export default function WorkoutSummary({
  isOpen,
  onClose,
  onSave,
  onShare,
  workout,
  duration,
  completedAt
}: WorkoutSummaryProps) {
  if (!isOpen) return null

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Workout Complete!</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Workout Details */}
            <div>
              <h3 className="font-medium text-gray-900">{workout.name}</h3>
              <p className="text-sm text-gray-500">{workout.type} Workout</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-lg font-medium">{formatDuration(duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-lg font-medium">
                  {formatDistanceToNow(completedAt, { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Exercises */}
            <div>
              <h3 className="font-medium mb-2">Exercises</h3>
              <ul className="space-y-2">
                {workout.exercises.map((exercise, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{exercise.name}</span>
                    {exercise.reps && <span className="text-gray-500"> - {exercise.reps} reps</span>}
                    {exercise.weight && <span className="text-gray-500"> @ {exercise.weight}kg</span>}
                    {exercise.distance && <span className="text-gray-500"> - {exercise.distance}m</span>}
                    {exercise.calories && <span className="text-gray-500"> - {exercise.calories} cals</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={onSave}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 