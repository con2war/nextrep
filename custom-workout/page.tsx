"use client"

import { useState } from "react"
import { Timer, Repeat, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface WorkoutType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  path: string
}

export default function CustomWorkout() {
  const workoutTypes: WorkoutType[] = [
    {
      id: 'for-time',
      name: 'FOR TIME',
      description: 'Complete the workout as quickly as possible while maintaining good form.',
      icon: <Timer className="w-6 h-6" />,
      path: '/custom-workout/for-time'
    },
    {
      id: 'emom',
      name: 'EMOM',
      description: 'Every Minute On the Minute. Complete the prescribed work within each minute.',
      icon: <Clock className="w-6 h-6" />,
      path: '/custom-workout/emom'
    },
    {
      id: 'amrap',
      name: 'AMRAP',
      description: 'As Many Rounds/Reps As Possible within the time cap.',
      icon: <Repeat className="w-6 h-6" />,
      path: '/custom-workout/amrap'
    },
    {
      id: 'tabata',
      name: 'TABATA',
      description: '20 seconds of work followed by 10 seconds of rest, typically for 8 rounds.',
      icon: <Timer className="w-6 h-6" />,
      path: '/custom-workout/tabata'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">WOD Board</h1>
        
        <div className="space-y-4">
          {workoutTypes.map((type) => (
            <Link 
              key={type.id}
              href={type.path}
              className="block"
            >
              <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-all bg-white/50 hover:bg-white/70">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {type.icon}
                    <h2 className="text-xl font-semibold">{type.name}</h2>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-600">{type.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

