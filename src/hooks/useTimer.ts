import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerOptions {
  onComplete?: () => void;
  warningThreshold?: number;
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  isWarning: boolean;
  progress: number;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export function useTimer(options?: UseTimerOptions): UseTimerReturn {
  const warningThreshold = options?.warningThreshold ?? 15;

  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((seconds: number) => {
    clearTimer();
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setIsRunning(true);
    endTimeRef.current = Date.now() + seconds * 1000;

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      options?.onTick?.(remaining);

      if (remaining <= 0) {
        clearTimer();
        setIsRunning(false);
        options?.onComplete?.();
      }
    }, 200);
  }, [clearTimer, options]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (timeLeft <= 0) return;
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      options?.onTick?.(remaining);

      if (remaining <= 0) {
        clearTimer();
        setIsRunning(false);
        options?.onComplete?.();
      }
    }, 200);
  }, [timeLeft, clearTimer, options]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeLeft(0);
    setTotalTime(0);
    setIsRunning(false);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const isWarning = isRunning && timeLeft > 0 && timeLeft <= warningThreshold;
  const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0;

  return { timeLeft, totalTime, isRunning, isWarning, progress, start, pause, resume, reset };
}