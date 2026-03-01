import { useEffect, useRef, useCallback } from 'react';
import { GamePhase, type GridlockAction } from '../types';
import { DAS_DELAY, ARR_DELAY } from '../constants';

type Direction = 'left' | 'right';

export function useInputHandler(
  phase: GamePhase,
  dispatch: React.Dispatch<GridlockAction>,
  onPause: () => void,
) {
  const dasTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeDirection = useRef<Direction | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const clearDAS = useCallback(() => {
    if (dasTimerRef.current) clearTimeout(dasTimerRef.current);
    if (arrTimerRef.current) clearInterval(arrTimerRef.current);
    dasTimerRef.current = null;
    arrTimerRef.current = null;
    activeDirection.current = null;
  }, []);

  const startDAS = useCallback(
    (dir: Direction) => {
      clearDAS();
      activeDirection.current = dir;
      const action = dir === 'left' ? 'MOVE_LEFT' : 'MOVE_RIGHT';
      dispatch({ type: action });

      dasTimerRef.current = setTimeout(() => {
        arrTimerRef.current = setInterval(() => {
          dispatch({ type: action });
        }, ARR_DELAY);
      }, DAS_DELAY);
    },
    [dispatch, clearDAS],
  );

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== GamePhase.Playing && phase !== GamePhase.Paused) return;

      // Pause/resume
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (phase === GamePhase.Paused) {
          dispatch({ type: 'RESUME' });
        } else {
          onPause();
        }
        return;
      }

      if (phase !== GamePhase.Playing) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (activeDirection.current !== 'left') startDAS('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (activeDirection.current !== 'right') startDAS('right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          dispatch({ type: 'SOFT_DROP' });
          break;
        case 'ArrowUp':
          e.preventDefault();
          dispatch({ type: 'ROTATE_CW' });
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          dispatch({ type: 'ROTATE_CCW' });
          break;
        case ' ':
          e.preventDefault();
          dispatch({ type: 'HARD_DROP' });
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          dispatch({ type: 'HOLD' });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        (e.key === 'ArrowLeft' && activeDirection.current === 'left') ||
        (e.key === 'ArrowRight' && activeDirection.current === 'right')
      ) {
        clearDAS();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearDAS();
    };
  }, [phase, dispatch, onPause, startDAS, clearDAS]);

  // Touch input
  useEffect(() => {
    if (phase !== GamePhase.Playing) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const SWIPE_THRESHOLD = 30;
      const TAP_THRESHOLD = 10;

      if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD && dt < 300) {
        // Tap = rotate
        dispatch({ type: 'ROTATE_CW' });
      } else if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
        // Horizontal swipe
        dispatch({ type: dx > 0 ? 'MOVE_RIGHT' : 'MOVE_LEFT' });
      } else if (absDy > SWIPE_THRESHOLD) {
        if (dy > 0) {
          // Swipe down
          dispatch({ type: dy > 100 ? 'HARD_DROP' : 'SOFT_DROP' });
        } else {
          // Swipe up = hard drop
          dispatch({ type: 'HARD_DROP' });
        }
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [phase, dispatch]);
}
