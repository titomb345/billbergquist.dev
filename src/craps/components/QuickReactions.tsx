import { useCallback, useRef, useState } from 'react';
import type { ReactionKey } from '../types';
import { EMOJI_MAP } from '../constants';
import styles from './QuickReactions.module.css';

const REACTIONS: { key: ReactionKey; emoji: string }[] = [
  { key: 'dice', emoji: EMOJI_MAP.dice },
  { key: 'fire', emoji: EMOJI_MAP.fire },
  { key: 'skull', emoji: EMOJI_MAP.skull },
  { key: 'clover', emoji: EMOJI_MAP.clover },
  { key: 'angry', emoji: EMOJI_MAP.angry },
  { key: 'clap', emoji: EMOJI_MAP.clap },
];

const COOLDOWN_MS = 1500;

interface SentReaction {
  id: number;
  emoji: string;
}

interface QuickReactionsProps {
  onReact: (reaction: ReactionKey) => void;
}

export function QuickReactions({ onReact }: QuickReactionsProps) {
  const lastSentRef = useRef(0);
  const [cooldown, setCooldown] = useState(false);
  const [sentReactions, setSentReactions] = useState<SentReaction[]>([]);
  const idRef = useRef(0);

  const handleClick = useCallback((reaction: ReactionKey) => {
    const now = Date.now();
    if (now - lastSentRef.current < COOLDOWN_MS) return;
    lastSentRef.current = now;
    setCooldown(true);
    onReact(reaction);

    const id = ++idRef.current;
    setSentReactions((prev) => [...prev, { id, emoji: EMOJI_MAP[reaction] }]);
    setTimeout(() => setSentReactions((prev) => prev.filter((r) => r.id !== id)), 2000);
    setTimeout(() => setCooldown(false), COOLDOWN_MS);
  }, [onReact]);

  return (
    <div className={styles.bar}>
      {sentReactions.map((r) => (
        <span key={r.id} className={styles.sent}>{r.emoji}</span>
      ))}
      {REACTIONS.map((r) => (
        <button
          key={r.key}
          className={`${styles.btn} ${cooldown ? styles.btnCooldown : ''}`}
          onClick={() => handleClick(r.key)}
          disabled={cooldown}
          aria-label={r.key}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
