import { useEffect, useMemo, useState } from 'react';

function calcRemaining(timerEnd: number | null): number {
  if (timerEnd === null) return 0;
  return Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
}

export function useTimer(timerEnd: number | null) {
  const initialValue = useMemo(() => calcRemaining(timerEnd), [timerEnd]);
  const [secondsRemaining, setSecondsRemaining] = useState(initialValue);

  // Reset state when timerEnd changes
  if (secondsRemaining !== initialValue && calcRemaining(timerEnd) === initialValue) {
    setSecondsRemaining(initialValue);
  }

  useEffect(() => {
    if (timerEnd === null) return;

    const interval = setInterval(() => {
      setSecondsRemaining(calcRemaining(timerEnd));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnd]);

  return {
    secondsRemaining,
    isExpired: timerEnd !== null && secondsRemaining === 0,
    isRunning: timerEnd !== null && secondsRemaining > 0,
  };
}
