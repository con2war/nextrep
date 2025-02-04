"use client"

import { useState, useEffect, useRef } from "react"

interface WorkoutCountdownProps {
    onComplete: () => void
    onStart: () => void
}

export default function WorkoutCountdown({ onComplete, onStart }: WorkoutCountdownProps) {
    const [countdownTime, setCountdownTime] = useState<number>(10)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize audio on component mount
    useEffect(() => {
        // Create audio element once
        audioRef.current = new Audio('/beep.mp3')
        audioRef.current.volume = 0.5
        
        // iOS requires user interaction before playing audio
        // Preload the audio
        if (audioRef.current) {
            audioRef.current.load()
        }

        // Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    // Call onStart in a separate useEffect
    useEffect(() => {
        onStart()
    }, [onStart])

    // Speech synthesis function
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.volume = 1.5
            window.speechSynthesis.speak(utterance)
        }
    }

    // Updated beep function for iOS compatibility
    const beep = () => {
        if (audioRef.current) {
            // Reset audio to start
            audioRef.current.currentTime = 0
            
            // Play with error handling
            const playPromise = audioRef.current.play()
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing beep:', error)
                })
            }
        }
    }

    // Countdown logic with single beep trigger
    useEffect(() => {
        let interval: NodeJS.Timeout
        let hasBeepPlayed = false

        if (countdownTime >= 0) {
            interval = setInterval(() => {
                setCountdownTime(prev => {
                    // Announce start of countdown
                    if (prev === 10) {
                        speak("Get ready")
                    }

                    // Play beep.mp3 once at exactly 3 seconds
                    if (prev === 3 && !hasBeepPlayed) {
                        window.speechSynthesis.cancel()
                        beep()
                        hasBeepPlayed = true
                    }

                    // Start workout when countdown reaches 0
                    if (prev === 0) {
                        speak("Begin")
                        onComplete()
                        return 0
                    }

                    return prev - 1
                })
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [countdownTime, onComplete])

    return (
        <div className={`text-6xl font-mono font-bold mb-4`}>
            {countdownTime}
        </div>
    )
} 