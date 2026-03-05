import { useState, useEffect, useRef } from 'react';
import styles from './BalanceChange.module.css';

interface BalanceChangeProps {
  myPlayerId: string;
  resolutions: { playerId: string; payout: number }[];
}

interface FloatingAmount {
  id: number;
  amount: number;
}

export function BalanceChange({ myPlayerId, resolutions }: BalanceChangeProps) {
  const [floats, setFloats] = useState<FloatingAmount[]>([]);
  const idRef = useRef(0);
  const prevResRef = useRef(resolutions);

  useEffect(() => {
    if (resolutions === prevResRef.current) return;
    prevResRef.current = resolutions;

    const myTotal = resolutions
      .filter((r) => r.playerId === myPlayerId)
      .reduce((sum, r) => sum + r.payout, 0);

    if (myTotal === 0) return;

    const id = ++idRef.current;
    // Delay to match dice landing + resolution overlay
    const timer = setTimeout(() => {
      setFloats((prev) => [...prev, { id, amount: myTotal }]);
    }, 1400);

    const removeTimer = setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 3400);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [resolutions, myPlayerId]);

  return (
    <div className={styles.container}>
      {floats.map((f) => (
        <span
          key={f.id}
          className={`${styles.float} ${f.amount > 0 ? styles.win : styles.loss}`}
        >
          {f.amount > 0 ? '+' : ''}{f.amount > 0 ? `$${f.amount}` : `-$${Math.abs(f.amount)}`}
        </span>
      ))}
    </div>
  );
}
