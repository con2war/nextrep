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

interface EmomWorkout {
  name: string
  intervalTime: number // This will always be in seconds in the session
  sets: number
  exercises: Exercise[]
}

export default function EmomSession() {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [workout, setWorkout] = useState<EmomWorkout | null>(null)
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

      utterance.pitch = 0.9
      utterance.rate = 1.1
      utterance.volume = 1.0
      
      if (text === "Let's Go" || text === "Well Done") {
        utterance.pitch = 1.1
        utterance.rate = 1.2
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  // Load workout data on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem('currentEmomWorkout')
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout)
      setWorkout(parsedWorkout)
      setTimeRemaining(parsedWorkout.intervalTime)
    } else {
      router.push('/custom-workout/emom')
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
        
        if (timeRemaining === 0) {
          if (currentExercise < (workout?.exercises.length || 0) - 1) {
            setCurrentExercise(prev => prev + 1)
            speak("Next")
            setTimeRemaining(workout?.intervalTime || 0)
            setTotalTime(prev => prev + 1)
          } else {
            if (currentRound < (workout?.sets || 0)) {
              setCurrentRound(prev => prev + 1)
              setCurrentExercise(0)
              speak("Next Round")
              setTimeRemaining(workout?.intervalTime || 0)
              setTotalTime(prev => prev + 1)
            } else {
              handleComplete()
            }
          }
        } else {
          setTimeRemaining(prev => prev - 1)
          setTotalTime(prev => prev + 1)
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, currentExercise, currentRound, workout])

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
        title: workout?.name || 'EMOM Workout',
        text: `I completed ${workout?.name} - ${workout?.sets} sets of ${workout?.exercises.length} exercises!`,
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
    setTimeRemaining(workout ? workout.intervalTime : 0)
    setCurrentRound(1)
    setCurrentExercise(0)
    setTotalTime(0)
  }

  // Format time to mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Start workout announcement
  const toggleTimer = () => {
    if (!isRunning) {
      if (currentRound === 1 && currentExercise === 0 && timeRemaining === workout?.intervalTime) {
        speak("Let's Go")
      }
    }
    setIsRunning(!isRunning)
  }

  // Don't render until workout is loaded
  if (!workout) {
    return null
  }

  const totalRounds = workout.sets * workout.exercises.length
  const currentRoundTotal = (currentRound - 1) * workout.exercises.length + currentExercise + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/custom-workout/emom"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => localStorage.removeItem('currentEmomWorkout')}
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

        {/* Round Counter */}
        <div className="text-center mb-4">
          <span className="text-xl font-semibold text-gray-600">
            Round {currentRoundTotal}/{totalRounds}
          </span>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-mono font-bold mb-4 ${
            timeRemaining <= 10 ? 'text-red-500' : ''
          }`}>
            {formatTime(timeRemaining)}
          </div>
          <button
            onClick={toggleTimer}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
            disabled={currentRoundTotal > totalRounds}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {timeRemaining === workout.intervalTime ? 'Start' : 'Resume'}
              </>
            )}
          </button>
        </div>

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Every {workout.intervalTime} seconds for {workout.sets} Set{workout.sets > 1 ? 's' : ''}:
          </h2>
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id}>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {exercise.metric === 'reps' && exercise.reps ? `${exercise.reps} reps` :
                   exercise.metric === 'distance' && exercise.distance ? `${exercise.distance}m` :
                   exercise.metric === 'calories' && exercise.calories ? `${exercise.calories} cals` : ''}
                  {exercise.weight ? ` (${exercise.weight}kg)` : ""}
                </p>
                {exercise.notes && (
                  <p className="text-sm text-gray-400">{exercise.notes}</p>
                )}
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
            type: 'EMOM',
            exercises: workout.exercises
          }}
          duration={totalTime}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  )
} 