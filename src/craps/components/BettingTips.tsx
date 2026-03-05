import { useState } from 'react';
import type { CrapsPhase } from '../types';
import styles from './BettingTips.module.css';

interface BettingTipsProps {
  phase: CrapsPhase;
  point: number | null;
}

const TIPS: Record<string, string[]> = {
  comeOut: [
    'Pass Line and Don\'t Pass are available on the come-out roll.',
    'A 7 or 11 is a natural (Pass wins). A 2, 3, or 12 is craps (Pass loses).',
    'Any other number establishes the point.',
    'Field bets are always available and resolve every roll.',
  ],
  point: [
    'Come and Don\'t Come bets are now available.',
    'Back your Pass Line bet with Odds for 0% house edge.',
    'Place 6 and Place 8 have the lowest house edge among place bets (1.52%).',
    'The shooter needs to hit the point before a 7 to win.',
  ],
  rolling: [
    'The shooter is about to roll. Good luck!',
  ],
  betting: [
    'Place your bets. All players must confirm before rolling.',
  ],
};

export function BettingTips({ phase, point }: BettingTipsProps) {
  const [expanded, setExpanded] = useState(false);

  let tips: string[];
  if (phase === 'rolling') {
    tips = TIPS.rolling;
  } else if (point === null) {
    tips = TIPS.comeOut;
  } else {
    tips = TIPS.point;
  }

  return (
    <div className={styles.tips}>
      <button className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
        <span>Tips</span>
        <span className={styles.arrow}>{expanded ? '\u25BC' : '\u25B2'}</span>
      </button>
      <div className={`${styles.collapse} ${expanded ? styles.collapseOpen : ''}`}>
        <div className={styles.collapseInner}>
          <ul className={styles.list}>
            {tips.map((tip, i) => (
              <li key={i} className={styles.tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
