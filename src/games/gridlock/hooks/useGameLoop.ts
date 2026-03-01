import { useEffect, useRef } from 'react';
import { GamePhase, type GridlockAction } from '../types';
import { LINE_CLEAR_DURATION } from '../constants';

export function useGameLoop(
  phase: GamePhase,
  dispatch: React.Dispatch<GridlockAction>,
) {
  const rafRef = useRef<number>(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Main game loop
  useEffect(() => {
    if (phase !== GamePhase.Playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (timestamp: number) => {
      dispatch({ type: 'TICK', timestamp });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, dispatch]);

  // Line clear animation timer
  useEffect(() => {
    if (phase !== GamePhase.LineClear) return;

    clearTimerRef.current = setTimeout(() => {
      dispatch({ type: 'CLEAR_ANIMATION_DONE' });
    }, LINE_CLEAR_DURATION);

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [phase, dispatch]);
}
