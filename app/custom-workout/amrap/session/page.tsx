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

interface AmrapWorkout {
  name: string
  timeCap: number
  exercises: Exercise[]
}

export default function AmrapSession() {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [workout, setWorkout] = useState<AmrapWorkout | null>(null)
  const [hasAnnouncedHalfway, setHasAnnouncedHalfway] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [completedAt, setCompletedAt] = useState<Date | null>(null)
  const [totalTime, setTotalTime] = useState(0)

  // Speech synthesis function with enhanced male voice
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      
      let voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          voices = window.speechSynthesis.getVoices()
        })
      }

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

      utterance.pitch = 1.1    // Lower pitch sounds more authoritative/motivational
      utterance.rate = 1.2     // Slightly slower for clarity and impact
      utterance.volume = 1.5 
      
      if (text === "Let's Go" || text === "Well Done" || text === "Half way") {
        utterance.pitch = 1.1
        utterance.rate = 1.2
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  // Load workout data on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem('currentAmrapWorkout')
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout)
      setWorkout(parsedWorkout)
      setTimeRemaining(parsedWorkout.timeCap * 60) // Convert minutes to seconds
    } else {
      router.push('/custom-workout/amrap')
    }
  }, [router])

  // Update timer logic to track total time and handle completion
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeRemaining >= 0) {
      interval = setInterval(() => {
        // Announce before updating the timer
        if (timeRemaining === 3) speak("3")
        if (timeRemaining === 2) speak("2")
        if (timeRemaining === 1) speak("1")
        
        // Check for halfway point
        if (workout && !hasAnnouncedHalfway && timeRemaining === Math.floor(workout.timeCap * 30)) {
          speak("Half way")
          setHasAnnouncedHalfway(true)
        }

        if (timeRemaining === 0) {
          handleComplete()
        } else {
          setTimeRemaining(prev => prev - 1)
          setTotalTime(prev => prev + 1)
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, workout, hasAnnouncedHalfway])

  const handleComplete = () => {
    setIsRunning(false)
    setCompletedAt(new Date())
    speak("Well Done")
    setShowSummary(true)
  }

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log('Saving workout...')
    setShowSummary(false)
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: workout?.name || 'AMRAP Workout',
        text: `I completed ${workout?.name} - ${workout?.timeCap} minute AMRAP!`,
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

  // Update reset timer to handle completion
  const resetTimer = () => {
    window.speechSynthesis.cancel()
    if (isRunning || totalTime > 0) {
      handleComplete()
    }
    setIsRunning(false)
    setTimeRemaining(workout ? workout.timeCap * 60 : 0)
    setHasAnnouncedHalfway(false)
    setTotalTime(0)
  }

  // Start workout announcement
  const toggleTimer = () => {
    if (!isRunning) {
      if (timeRemaining === (workout?.timeCap || 0) * 60) {
        speak("Let's Go")
      }
    }
    setIsRunning(!isRunning)
  }

  // Format time to mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
            href="/custom-workout/amrap"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => localStorage.removeItem('currentAmrapWorkout')}
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
          <div className={`text-6xl font-mono font-bold mb-4 ${
            timeRemaining <= 60 ? 'text-red-500' : ''
          }`}>
            {formatTime(timeRemaining)}
          </div>
          <button
            onClick={toggleTimer}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
            disabled={timeRemaining === 0}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {timeRemaining === workout.timeCap * 60 ? 'Start' : 'Resume'}
              </>
            )}
          </button>
        </div>

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {workout.timeCap} Minute AMRAP:
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
            type: 'AMRAP',
            exercises: workout.exercises
          }}
          duration={totalTime}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  )
} 