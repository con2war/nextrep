"use client"

import { useState, useEffect } from "react"
import { Play, Pause, XCircle, ChevronLeft, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import WorkoutSummary from "@/app/components/WorkoutSummary"
import WorkoutCountdown from "@/app/components/WorkoutCountdown"

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
  timer: number
}

export default function AmrapSession() {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [workout, setWorkout] = useState<AmrapWorkout | null>(null)
  const [hasAnnouncedHalfway, setHasAnnouncedHalfway] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [completedAt, setCompletedAt] = useState<Date | null>(null)
  const [totalTime, setTotalTime] = useState(0)
  const [showCountdown, setShowCountdown] = useState(false)
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)

  // Initialize beep sound on mount
  useEffect(() => {
    const audio = new Audio('/beep.mp3')
    audio.volume = 0.5
    audio.preload = 'auto'

    // Add event listeners for debugging
    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e)
    })

    audio.addEventListener('canplaythrough', () => {
      console.log('Audio loaded successfully')
    })

    try {
      audio.load()
      setBeepSound(audio)
    } catch (error) {
      console.error('Error loading audio:', error)
    }

    // Cleanup
    return () => {
      audio.removeEventListener('error', () => {})
      audio.removeEventListener('canplaythrough', () => {})
    }
  }, [])

  // Initialize audio on first user interaction
  const initializeAudio = () => {
    if (!audioInitialized && beepSound) {
      console.log('Attempting to initialize audio...')
      // iOS requires user interaction to start audio context
      const playPromise = beepSound.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            beepSound.pause()
            beepSound.currentTime = 0
          })
          .catch(error => console.error('Audio initialization error:', error))
      }
      setAudioInitialized(true)
    }
  }

  // Test and initialize audio
  const testAudio = () => {
    if (isAudioEnabled) {
      // Initialize beep
      if (beepSound) {
        beepSound.currentTime = 0
        const playPromise = beepSound.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              beepSound.pause()
              beepSound.currentTime = 0
              console.log('Beep sound tested successfully')
            })
            .catch(error => console.error('Beep test error:', error))
        }

        // Test speech synthesis
        if ('speechSynthesis' in window) {
          const testUtterance = new SpeechSynthesisUtterance("Audio check")
          testUtterance.volume = 1.5
          window.speechSynthesis.speak(testUtterance)
        }
      }
    }
  }

  // Toggle audio state
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    if (!audioInitialized) {
      testAudio()
      setAudioInitialized(true)
    }
  }

  // Update speak function to respect audio state
  const speak = (text: string) => {
    if (isAudioEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.volume = 1.5
      window.speechSynthesis.speak(utterance)
    }
  }

  // Update beep function to respect audio state
  const beep = () => {
    if (isAudioEnabled && beepSound) {
      beepSound.currentTime = 0
      const playPromise = beepSound.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing beep:', error)
          setTimeout(() => {
            beepSound.play().catch(e => console.error('Retry error:', e))
          }, 100)
        })
      }
    }
  }

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Load workout data on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem('currentAmrapWorkout')
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout)
      setWorkout(parsedWorkout)
      setTimeRemaining(parsedWorkout.timer)
    } else {
      router.push('/custom-workout/amrap')
    }
  }, [router])

  const handleComplete = () => {
    setIsRunning(false)
    setCompletedAt(new Date())
    speak("Well done")
    setShowSummary(true)
  }

  // Timer logic with Web Speech API
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && !isPaused && workout) {
      interval = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1

          // Announce halfway through workout
          if (newTime === Math.floor(workout.timeCap * 60 / 2)) {
            speak("Half way")
          }

          // Announce 10 seconds remaining
          if (newTime === 10) {
            speak("10 seconds remaining")
          }

          // Handle workout completion
          if (newTime <= 0) {
            handleComplete()
            return 0
          }

          return newTime
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, isPaused, workout, handleComplete])

  // Start workout with audio initialization
  const startWorkout = () => {
    if (isRunning) {
      setIsRunning(false)
      setIsPaused(true)
    } else {
      if (isPaused) {
        setIsRunning(true)
        setIsPaused(false)
      } else {
        initializeAudio() // Initialize beep sound on first start
        setShowCountdown(true)
      }
    }
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
            onClick={handleComplete}
            className="flex items-center text-red-500 hover:text-red-600 transition-colors"
          >
            <XCircle className="w-5 h-5 mr-1" />
            End Workout
          </button>
        </div>

        {/* Workout Name */}
        <h1 className="text-3xl font-bold mb-4 text-center">{workout.name}</h1>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-mono font-bold mb-4 ${
            timeRemaining <= 10 ? 'text-red-500' : ''
          }`}>
            {showCountdown ? (
              <WorkoutCountdown 
                onComplete={() => {
                  setShowCountdown(false)
                  setIsRunning(true)
                }}
                onStart={() => {
                  setIsRunning(false)
                  setIsPaused(false)
                }}
              />
            ) : (
              formatTime(timeRemaining)
            )}
          </div>
          <div className="flex justify-center gap-4 items-center">
            <button
              onClick={startWorkout}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {isPaused ? 'Resume' : 'Start'}
                </>
              )}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg ${
                isAudioEnabled 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white transition-colors`}
              title={isAudioEnabled ? 'Disable Audio' : 'Enable Audio'}
            >
              {isAudioEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Current Exercise Display */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Current Exercise:</h2>
          <div className="text-lg">
            {workout?.exercises[currentExercise]?.name}
          </div>
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