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

interface TabataWorkout {
  name: string
  rounds: number
  workInterval: number
  restInterval: number
  exercises: Exercise[]
  workTime: number
  restTime: number
}

export default function TabataSession() {
  const router = useRouter()
  const [workout, setWorkout] = useState<TabataWorkout | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isWorkPeriod, setIsWorkPeriod] = useState(true)
  const [showSummary, setShowSummary] = useState(false)
  const [completedAt, setCompletedAt] = useState<Date | null>(null)
  const [totalTime, setTotalTime] = useState(0)
  const [showCountdown, setShowCountdown] = useState(false)
  const [beepSound, setBeepSound] = useState<HTMLAudioElement | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)

  // Load workout data on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem('currentTabataWorkout')
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout)
      setWorkout(parsedWorkout)
      setTimeRemaining(parsedWorkout.workTime)
      setIsWorkPeriod(true)
    } else {
      router.push('/custom-workout/tabata')
    }
  }, [router])

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
      }

      // Test speech synthesis
      if ('speechSynthesis' in window) {
        const testUtterance = new SpeechSynthesisUtterance("Audio check")
        testUtterance.volume = 1.5
        window.speechSynthesis.speak(testUtterance)
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

  const handleComplete = () => {
    setIsRunning(false)
    setCompletedAt(new Date())
    speak("Well done")
    setShowSummary(true)
  }

  // Timer logic with beep only at 3 seconds remaining
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && !isPaused && workout) {
      interval = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1
          console.log('Time remaining:', newTime)

          // Play beep at 3 seconds remaining for both work and rest intervals
          if (newTime === 3) {
            console.log('3 seconds remaining - Playing beep')
            beep()
          }

          // Handle interval completion
          if (newTime <= 0) {
            if (currentRound < workout.rounds * 2) { // Multiply by 2 to account for both work and rest periods
              // Update interval type and round
              if (isWorkPeriod) {
                speak("Rest")
                setTimeRemaining(workout.restTime)
              } else {
                const nextRound = Math.ceil((currentRound + 1) / 2)
                if (nextRound <= workout.rounds) {
                  speak(`Round ${nextRound}`)
                }
                setTimeRemaining(workout.workTime)
              }
              
              setIsWorkPeriod(!isWorkPeriod)
              setCurrentRound(currentRound + 1)
            } else {
              handleComplete()
            }
            return 0
          }

          return newTime
        })
      }, 1000)
    }

    return () => {
      clearInterval(interval)
      console.log('Timer cleanup')
    }
  }, [isRunning, isPaused, workout, currentRound, isWorkPeriod, handleComplete])

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

  // Speech synthesis function with enhanced male voice
  const speak = (text: string) => {
    if (isAudioEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Get available voices and wait if needed
      let voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          voices = window.speechSynthesis.getVoices()
        })
      }

      // Try to find a male voice
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
      
      // Add emphasis to motivational phrases
      if (text === "Let's Go" || text === "Well Done") {
        utterance.pitch = 1.1
        utterance.rate = 1.2
      }

      window.speechSynthesis.speak(utterance)
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
        title: workout?.name || 'Tabata Workout',
        text: `I completed ${workout?.name} - ${workout?.rounds} rounds of ${workout?.exercises.length} exercises!`,
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

  // Start workout with countdown
  const startWorkout = () => {
    if (isRunning) {
      setIsRunning(false)
      setIsPaused(true)
    } else if (isPaused) {
      setIsRunning(true)
      setIsPaused(false)
    } else {
      // Only show countdown when starting fresh
      setShowCountdown(true)
    }
  }

  // Don't render until workout is loaded
  if (!workout) {
    return null
  }

  const totalRounds = workout.rounds * workout.exercises.length
  const currentRoundTotal = (currentRound - 1) * workout.exercises.length + currentExercise + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/custom-workout/tabata"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => localStorage.removeItem('currentTabataWorkout')}
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

        {/* Round Counter */}
        <div className="text-center mb-4">
          <span className="text-xl font-semibold text-gray-600">
            Round {currentRoundTotal}/{totalRounds}
          </span>
        </div>

        {/* Interval Type */}
        <div className="text-center mb-4">
          <span className={`text-xl font-bold ${isWorkPeriod ? 'text-green-500' : 'text-red-500'}`}>
            {isWorkPeriod ? 'WORK' : 'REST'}
          </span>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-mono font-bold mb-4 ${
            timeRemaining <= 3 ? 'text-red-500' : ''
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

        {/* Workout Details */}
        <div className="bg-white/50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            {workout.rounds} Round{workout.rounds > 1 ? 's' : ''} of Tabata:
            <span className="block text-base font-normal text-gray-600 mt-1">
              {workout.workTime}s work / {workout.restTime}s rest
            </span>
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
            type: 'TABATA',
            exercises: workout.exercises
          }}
          duration={totalTime}
          completedAt={completedAt || new Date()}
        />
      </main>
    </div>
  )
} 