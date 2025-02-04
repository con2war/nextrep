"use client"

import { useState, useEffect } from "react"

interface WorkoutCountdownProps {
    onComplete: () => void
    onStart: () => void
}

export default function WorkoutCountdown({ onComplete, onStart }: WorkoutCountdownProps) {
    const [countdownTime, setCountdownTime] = useState<number>(10)

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

    // Updated beep function
    const beep = () => {
        const audio = new Audio('/beep.mp3')  // Create a short beep sound file
        audio.volume = 0.5  // Adjust volume as needed
        audio.play().catch(error => console.error('Error playing beep:', error))
    }

    // Countdown logic
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (countdownTime >= 0) {
            interval = setInterval(() => {
                setCountdownTime(prev => {
                    // Announce start of countdown
                    if (prev === 10) {
                        speak("Get ready")
                    }

                    // Play 3-beep countdown sound at 3 seconds remaining
                    if (prev === 4) {
                        window.speechSynthesis.cancel() // Cancel any ongoing speech
                        beep()
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