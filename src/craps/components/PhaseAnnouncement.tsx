import { useState, useEffect, useRef } from 'react';
import type { CrapsPhase } from '../types';
import { POST_ROLL_DELAY_MS } from '../constants';
import styles from './PhaseAnnouncement.module.css';

interface PhaseAnnouncementProps {
  phase: CrapsPhase;
  point: number | null;
  lastRollTotal: number | null;
  suppress?: boolean;
}

interface Announcement {
  id: number;
  title: string;
  subtitle: string;
  tone: 'neutral' | 'danger' | 'success';
}

export function PhaseAnnouncement({ phase, point, lastRollTotal, suppress = false }: PhaseAnnouncementProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const prevPhaseRef = useRef(phase);
  const prevPointRef = useRef(point);
  const idRef = useRef(0);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const prevPoint = prevPointRef.current;
    prevPhaseRef.current = phase;
    prevPointRef.current = point;

    let title = '';
    let subtitle = '';
    let tone: Announcement['tone'] = 'neutral';

    // Point just established
    if (point !== null && prevPoint === null && prevPhase !== 'lobby') {
      title = `POINT IS ${point}`;
      subtitle = 'Hit it before the seven';
      tone = 'success';
    }
    // Seven-out (had a point, now it's gone and we're betting again)
    else if (prevPoint !== null && point === null && lastRollTotal === 7 && phase === 'betting') {
      title = 'SEVEN OUT';
      subtitle = 'New shooter';
      tone = 'danger';
    }
    // Point hit (had a point, resolved, point cleared, still same phase flow)
    else if (prevPoint !== null && point === null && lastRollTotal === prevPoint && phase === 'betting') {
      title = 'WINNER!';
      subtitle = `${prevPoint} hit. New come-out roll`;
      tone = 'success';
    }
    // Come-out craps (2, 3, 12 on come-out)
    else if (prevPoint === null && point === null && lastRollTotal !== null && [2, 3, 12].includes(lastRollTotal) && phase === 'betting') {
      title = 'CRAPS';
      subtitle = `Rolled ${lastRollTotal}`;
      tone = 'danger';
    }
    // Come-out natural (7 or 11 on come-out)
    else if (prevPoint === null && point === null && lastRollTotal === 7 && phase === 'betting' && prevPhase !== 'lobby') {
      title = 'NATURAL';
      subtitle = 'Seven on the come-out!';
      tone = 'success';
    }
    else if (prevPoint === null && point === null && lastRollTotal === 11 && phase === 'betting') {
      title = 'YO ELEVEN!';
      subtitle = 'Natural winner!';
      tone = 'success';
    }
    // Game just started
    else if (prevPhase === 'lobby' && phase === 'betting') {
      title = 'GAME ON';
      subtitle = 'Place your bets';
      tone = 'neutral';
    }

    if (!title) return;

    const id = ++idRef.current;

    const showDelay = prevPhase === 'lobby' ? 0 : POST_ROLL_DELAY_MS;

    const showTimer = setTimeout(() => {
      setAnnouncement({ id, title, subtitle, tone });
    }, showDelay);

    const hideTimer = setTimeout(() => {
      setAnnouncement((prev) => (prev?.id === id ? null : prev));
    }, showDelay + 2200);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [phase, point, lastRollTotal]);

  if (!announcement || suppress) return null;

  return (
    <div key={announcement.id} className={`${styles.banner} ${styles[announcement.tone]}`}>
      <span className={styles.title}>{announcement.title}</span>
      <span className={styles.subtitle}>{announcement.subtitle}</span>
    </div>
  );
}
