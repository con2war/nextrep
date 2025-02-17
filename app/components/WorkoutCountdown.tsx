"use client";

import { useState, useEffect, useRef } from "react";

interface WorkoutCountdownProps {
  onComplete: () => void;
  onStart: () => void;
}

export default function WorkoutCountdown({ onComplete, onStart }: WorkoutCountdownProps) {
  const [countdownTime, setCountdownTime] = useState<number>(10);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const getReadyAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize beep.mp3 and getready.mp3 on component mount.
  useEffect(() => {
    // Beep audio for 3 seconds remaining.
    const beepAudio = new Audio('/beep.mp3');
    beepAudio.volume = 0.5;
    beepAudio.preload = "auto";
    beepAudio.load();
    beepAudioRef.current = beepAudio;

    // getready.mp3 for "Get ready" cue.
    const getReadyAudio = new Audio('/getready.mp3');
    getReadyAudio.volume = 1.0;
    getReadyAudio.preload = "auto";
    getReadyAudio.load();
    getReadyAudioRef.current = getReadyAudio;

    return () => {
      if (beepAudioRef.current) {
        beepAudioRef.current.pause();
        beepAudioRef.current = null;
      }
      if (getReadyAudioRef.current) {
        getReadyAudioRef.current.pause();
        getReadyAudioRef.current = null;
      }
    };
  }, []);

  // Call onStart immediately when the component mounts.
  useEffect(() => {
    onStart();
  }, [onStart]);

  // Beep function for playing beep.mp3.
  const playBeep = () => {
    if (beepAudioRef.current) {
      beepAudioRef.current.currentTime = 0;
      beepAudioRef.current.play().catch((error) => {
        console.error("Error playing beep.mp3:", error);
        setTimeout(() => {
          beepAudioRef.current?.play().catch((e) => console.error("Retry error:", e));
        }, 100);
      });
    }
  };

  // Function to play getready.mp3.
  const playGetReady = () => {
    if (getReadyAudioRef.current) {
      getReadyAudioRef.current.currentTime = 0;
      getReadyAudioRef.current.play().catch((error) => {
        console.error("Error playing getready.mp3:", error);
      });
    }
  };

  // Countdown logic with one-time beep trigger.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let hasBeepPlayed = false;

    if (countdownTime >= 0) {
      interval = setInterval(() => {
        setCountdownTime((prev) => {
          // When timer is at 10, play getready.mp3 once.
          if (prev === 8) {
            playGetReady();
          }
          // At 3 seconds remaining, play beep.mp3 once.
          if (prev === 3 && !hasBeepPlayed) {
            playBeep();
            hasBeepPlayed = true;
          }
          // When countdown reaches 0, call onComplete without any additional vocal cue.
          if (prev === 0) {
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [countdownTime, onComplete]);

  return (
    <div className="text-6xl font-mono font-bold mb-4">
      {countdownTime}
    </div>
  );
}
