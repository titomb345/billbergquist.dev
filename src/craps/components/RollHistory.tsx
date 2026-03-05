import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useDraggable } from 'react-use-draggable-scroll';
import type { DiceRoll } from '../types';
import styles from './RollHistory.module.css';

interface RollHistoryProps {
  rolls: DiceRoll[];
}

function getOutcome(total: number): { label: string; color: string } {
  if (total === 7) return { label: '7', color: 'red' };
  if (total === 11) return { label: 'Yo', color: 'green' };
  if (total === 2 || total === 3 || total === 12) return { label: 'Craps', color: 'red' };
  return { label: String(total), color: 'neutral' };
}

export function RollHistory({ rolls }: RollHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement | null>;
  const { events } = useDraggable(scrollRef as React.MutableRefObject<HTMLDivElement>, {
    decayRate: 0.96,
  });
  const [atEnd, setAtEnd] = useState(false);
  const prevScrollWidth = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 10);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // When a new roll prepends (reversed list), compensate scrollLeft so visible pills don't shift
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const newWidth = el.scrollWidth;
    if (prevScrollWidth.current > 0 && newWidth > prevScrollWidth.current) {
      const delta = newWidth - prevScrollWidth.current;
      if (el.scrollLeft < 20) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += delta;
      }
    }
    prevScrollWidth.current = newWidth;
  }, [rolls.length]);

  return (
    <div className={styles.history}>
      <span className={styles.label}>Roll History<br /><span className={styles.count}>({rolls.length})</span></span>
      <div className={`${styles.rollsWrapper} ${atEnd ? styles.atEnd : ''}`}>
        <div
          className={styles.rolls}
          ref={scrollRef}
          {...events}
        >
          {rolls.length === 0 ? (
            <span className={styles.empty}>Waiting for first roll...</span>
          ) : (
            [...rolls].reverse().map((roll, i) => {
              const { label, color } = getOutcome(roll.total);
              return (
                <div key={i} className={`${styles.roll} ${styles[color] ?? ''}`}>
                  <span className={styles.dice}>{roll.die1}+{roll.die2}</span>
                  <span className={styles.total}>{label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
