import { useEffect, useState } from 'react';
import type { ReactionKey } from '../types';
import { EMOJI_MAP } from '../constants';
import styles from './FloatingReaction.module.css';

const DURATION_MS = 2500;

export interface ActiveReaction {
  id: string;
  playerId: string;
  reaction: ReactionKey;
}

interface FloatingReactionProps {
  reaction: ActiveReaction;
  onComplete: (id: string) => void;
}

export function FloatingReaction({ reaction, onComplete }: FloatingReactionProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), DURATION_MS - 400);
    const removeTimer = setTimeout(() => onComplete(reaction.id), DURATION_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [reaction.id, onComplete]);

  return (
    <div className={`${styles.bubble} ${exiting ? styles.bubbleExit : ''}`}>
      <span className={styles.emoji}>{EMOJI_MAP[reaction.reaction]}</span>
    </div>
  );
}
