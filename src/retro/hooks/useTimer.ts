import { useEffect, useState } from 'react';

export function useTimer(timerEnd: number | null) {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (timerEnd === null) {
      setSecondsRemaining(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerEnd]);

  return {
    secondsRemaining,
    isExpired: timerEnd !== null && secondsRemaining === 0,
    isRunning: timerEnd !== null && secondsRemaining > 0,
  };
}
