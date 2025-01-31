"use client"

import { useState } from "react"
import Header from "../components/Header"

interface Exercise {
  name: string
  sets: number
  reps: number
}

export default function CustomWorkout() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentExercise, setCurrentExercise] = useState<Exercise>({ name: "", sets: 0, reps: 0 })

  const addExercise = () => {
    if (currentExercise.name && currentExercise.sets > 0 && currentExercise.reps > 0) {
      setExercises([...exercises, currentExercise])
      setCurrentExercise({ name: "", sets: 0, reps: 0 })
    }
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-primary mb-6">Custom Workout Builder</h1>
        <div className="bg-secondary p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold text-primary mb-4">Add Exercise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Exercise name"
              value={currentExercise.name}
              onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
              className="p-2 bg-background text-text rounded"
            />
            <input
              type="number"
              placeholder="Sets"
              value={currentExercise.sets || ""}
              onChange={(e) => setCurrentExercise({ ...currentExercise, sets: Number.parseInt(e.target.value) })}
              className="p-2 bg-background text-text rounded"
            />
            <input
              type="number"
              placeholder="Reps"
              value={currentExercise.reps || ""}
              onChange={(e) => setCurrentExercise({ ...currentExercise, reps: Number.parseInt(e.target.value) })}
              className="p-2 bg-background text-text rounded"
            />
          </div>
          <button
            onClick={addExercise}
            className="bg-primary text-secondary font-semibold py-2 px-4 rounded hover:bg-opacity-80 transition-colors"
          >
            Add Exercise
          </button>
        </div>
        {exercises.length > 0 && (
          <div className="bg-secondary p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-primary mb-4">Your Custom Workout</h2>
            <ul>
              {exercises.map((exercise, index) => (
                <li key={index} className="flex justify-between items-center mb-2">
                  <span>
                    {exercise.name} - {exercise.sets} sets of {exercise.reps} reps
                  </span>
                  <button onClick={() => removeExercise(index)} className="text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}

