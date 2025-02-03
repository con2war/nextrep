"use client"

import { useState, useEffect } from "react"
import { Play, Pause, XCircle, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import WorkoutSummary from "@/app/components/WorkoutSummary"

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

interface ForTimeWorkout {
  name: string
  rounds: number
  exercises: Exercise[]
}

export default function ForTimeSession() {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [workout, setWorkout] = useState<ForTimeWorkout | null>(null)
  const [hasAnnouncedStart, setHasAnnouncedStart] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [completedAt, setCompletedAt] = useState<Date | null>(null)

  // Speech synthesis function with enhanced male voice
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Get available voices and wait if needed
      let voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        // Some browsers need a moment to load voices
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          voices = window.speechSynthesis.getVoices()
        })
      }

      // Try to find a male voice (often indicated in the name or "gender" property)
      const preferredVoice = voices.find(
        voice => 
          (voice.name.includes('Male') || 
           voice.name.includes('Daniel') ||
           voice.name.includes('David') ||
           voice.name.includes('James')) &&
          (voice.lang.includes('en-US') || voice.lang.includes('en-GB'))
      )

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      // Adjust for enthusiasm and lower tone
      utterance.pitch = 0.9     // Lower pitch for deeper voice (0.5 to 1.5)
      utterance.rate = 1.1      // Slightly faster for enthusiasm
      utterance.volume = 1.0    // Full volume
      
      // Add emphasis to motivational phrases
      if (text === "Let's Go" || text === "Well Done") {
        utterance.pitch = 1.1   // Slightly higher pitch for excitement
        utterance.rate = 1.2    // Faster for enthusiasm
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  // Load workout data on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem('currentForTimeWorkout')
    if (savedWorkout) {
      setWorkout(JSON.parse(savedWorkout))
    } else {
      // If no workout data, redirect back to creator
      router.push('/custom-workout/for-time')
    }
  }, [router])

  // Timer logic with synchronized vocal cues
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      // Announce start only once
      if (!hasAnnouncedStart) {
        speak("Let's Go")
        setHasAnnouncedStart(true)
      }

      interval = setInterval(() => {
        setTime((prevTime) => {
          // Announce every minute
          if (prevTime > 0 && (prevTime + 1) % 60 === 0) {
            const minutes = Math.floor((prevTime + 1) / 60)
            speak(`${minutes} minute${minutes > 1 ? 's' : ''}`)
          }
          return prevTime + 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, hasAnnouncedStart])

  // Format time to mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    if (isRunning) {
      speak("Paused")
    } else if (time === 0) {
      // Will trigger start announcement in the effect
      setHasAnnouncedStart(false)
    } else {
      speak("Resuming")
    }
    setIsRunning(!isRunning)
  }

  const handleComplete = () => {
    window.speechSynthesis.cancel()
    setIsRunning(false)
    setCompletedAt(new Date())
    speak(`Final time ${Math.floor(time / 60)} minutes and ${time % 60} seconds`)
    setTimeout(() => {
      speak("Well Done")
      setShowSummary(true)
    }, 2000)
  }

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log('Saving workout...')
    setShowSummary(false)
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: workout?.name || 'For Time Workout',
        text: `I completed ${workout?.name} in ${formatTime(time)}!`,
        url: window.location.href
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        )
        alert('Workout details copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
    setShowSummary(false)
  }

  // Replace the resetTimer function with handleComplete
  const resetTimer = () => {
    if (time > 0) {
      handleComplete()
    } else {
      window.speechSynthesis.cancel()
      setIsRunning(false)
      setTime(0)
      setHasAnnouncedStart(false)
    }
  }

  // Don't render until workout is loaded
  if (!workout) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/custom-workout/for-time"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => {
              localStorage.removeItem('currentForTimeWorkout')
              window.speechSynthesis.cancel()
            }}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Exit Workout
          </Link>
          <button
            onClick={resetTimer}
            className="text-red-500 hover:text-red-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Workout Name */}
        <h1 className="text-3xl font-bold mb-4 text-center">{workout.name}</h1>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold mb-4">{formatTime(time)}</div>
          <button
            onClick={toggleTimer}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {time === 0 ? 'Start' : 'Resume'}
              </>
            )}
          </button>
        </div>

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {workout.rounds > 1 ? `${workout.rounds} Rounds For Time:` : 'For Time:'}
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-gray-500">
                    {exercise.metric === 'reps' && exercise.reps ? `${exercise.reps} reps` :
                     exercise.metric === 'distance' && exercise.distance ? `${exercise.distance}m` :
                     exercise.metric === 'calories' && exercise.calories ? `${exercise.calories} cals`
                     : ''}
                    {exercise.weight ? ` (${exercise.weight}kg)` : ""}
                  </p>
                  {exercise.notes && (
                    <p className="text-sm text-gray-400">{exercise.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add WorkoutSummary component */}
        <WorkoutSummary
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          onSave={handleSave}
          onShare={handleShare}
          workout={{
            name: workout.name,
            type: 'FOR TIME',
            exercises: workout.exercises
          }}
          duration={time}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  )
} 