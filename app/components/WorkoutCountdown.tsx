"use client";

import { useState, useEffect, useRef } from "react";

interface WorkoutCountdownProps {
  onComplete: () => void;
  onStart: () => void;
}

const WorkoutCountdown: React.FC<WorkoutCountdownProps> = ({ onComplete, onStart }) => {
  const [count, setCount] = useState<number>(10);
  const startRef = useRef(false);

  useEffect(() => {
    if (!startRef.current) {
      startRef.current = true;
      onStart();
    }

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [onComplete, onStart]);

  return <div className="text-6xl font-mono">{count}</div>;
};

export default WorkoutCountdown;
