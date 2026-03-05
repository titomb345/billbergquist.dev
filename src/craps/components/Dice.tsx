import { useState, useEffect, useRef } from 'react';
import type { DiceRoll } from '../types';
import { DICE_ANIMATION_MS } from '../constants';
import styles from './Dice.module.css';

interface DiceProps {
  lastRoll: DiceRoll | null;
  point: number | null;
  onRollingChange?: (rolling: boolean) => void;
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};

function DieFace({ value, rolling }: { value: number; rolling: boolean }) {
  const dots = DOT_POSITIONS[value] ?? [];

  return (
    <div className={`${styles.die} ${rolling ? styles.dieRolling : styles.dieLanded}`}>
      <div className={styles.dieInner}>
        <div className={styles.face}>
          {dots.map(([x, y], i) => (
            <div
              key={i}
              className={styles.pip}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
        </div>
        <div className={styles.dieShine} />
      </div>
    </div>
  );
}

export function Dice({ lastRoll, point, onRollingChange }: DiceProps) {
  const [rolling, setRolling] = useState(false);
  const [displayRoll, setDisplayRoll] = useState<DiceRoll | null>(null);
  const [flickerValues, setFlickerValues] = useState<[number, number]>([1, 1]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRollingChangeRef = useRef(onRollingChange);
  useEffect(() => { onRollingChangeRef.current = onRollingChange; }, [onRollingChange]);

  useEffect(() => {
    if (!lastRoll) return;

    // Start rolling on next frame to avoid synchronous setState in effect
    const raf = requestAnimationFrame(() => {
      setRolling(true);
      onRollingChangeRef.current?.(true);
    });

    // Flicker random faces during roll
    intervalRef.current = setInterval(() => {
      setFlickerValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 80);

    const timer = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRolling(false);
      onRollingChangeRef.current?.(false);
      setDisplayRoll(lastRoll);
    }, DICE_ANIMATION_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastRoll]);

  const die1 = rolling ? flickerValues[0] : (displayRoll?.die1 ?? 1);
  const die2 = rolling ? flickerValues[1] : (displayRoll?.die2 ?? 1);
  const total = displayRoll?.total;

  const isSevenOut = total === 7;
  const isYo = total === 11;
  const isCraps = total === 2 || total === 3 || total === 12;
  const isPointHit = total !== null && total === point;

  return (
    <div className={styles.container}>
      <div className={`${styles.diceRow} ${rolling ? styles.diceRowRolling : ''}`}>
        <DieFace value={die1} rolling={rolling} />
        <DieFace value={die2} rolling={rolling} />
      </div>
      <div
        className={[
          styles.totalDisplay,
          displayRoll && !rolling ? styles.totalVisible : '',
          isSevenOut ? styles.totalSeven : '',
          isYo ? styles.totalYo : '',
          isCraps ? styles.totalCraps : '',
          isPointHit ? styles.totalPoint : '',
        ].filter(Boolean).join(' ')}
      >
        <span className={styles.totalNumber}>{total ?? ''}</span>
        <span className={styles.totalLabel}>
          {isYo ? 'YO!' : isCraps ? 'CRAPS' : isSevenOut ? 'SEVEN' : isPointHit ? 'POINT!' : ''}
        </span>
      </div>
    </div>
  );
}
