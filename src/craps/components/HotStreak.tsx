import styles from './HotStreak.module.css';

interface HotStreakProps {
  rollHistory: { total: number }[];
  point: number | null;
}

export function HotStreak({ rollHistory, point }: HotStreakProps) {
  if (rollHistory.length < 6) return null;

  // Count consecutive rolls since last seven-out
  // A seven-out is a 7 rolled when a point was active (not on come-out)
  // We walk backward; if the most recent roll IS a 7 with no point, that's
  // a seven-out that just happened — streak should be 0.
  let streakCount = 0;
  for (let i = rollHistory.length - 1; i >= 0; i--) {
    if (rollHistory[i].total === 7) {
      // The most recent roll: check current point state.
      // If point is null now AND the roll is 7, this was a seven-out
      // (point got cleared after resolution).
      if (i === rollHistory.length - 1 && point === null) break;
      // Older 7s in history were seven-outs for prior shooters
      if (i < rollHistory.length - 1) break;
    }
    streakCount++;
  }

  if (streakCount < 6) return null;

  const isOnFire = streakCount >= 12;
  const isHot = streakCount >= 8;

  return (
    <div className={`${styles.streak} ${isOnFire ? styles.onFire : isHot ? styles.hot : ''}`}>
      <span className={styles.flame}>{isOnFire ? '\u{1F525}\u{1F525}' : '\u{1F525}'}</span>
      <span className={styles.count}>{streakCount} rolls</span>
      <span className={styles.label}>{isOnFire ? 'ON FIRE!' : isHot ? 'HOT ROLL' : 'Hot Streak'}</span>
    </div>
  );
}
