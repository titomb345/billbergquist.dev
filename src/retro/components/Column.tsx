import { useRef, useEffect } from 'react';
import type { Column as ColumnType, Card, ClientMessage, RetroPhase } from '../types';
import { COLUMN_CSS_MAP } from '../constants';
import { StickyNote } from './StickyNote';
import { CardInput } from './CardInput';
import styles from './Column.module.css';

interface ColumnProps {
  column: ColumnType;
  cards: Card[];
  phase: RetroPhase;
  myParticipantId: string;
  hostId: string;
  canVote: boolean;
  privacyMode: boolean;
  onSend: (msg: ClientMessage) => void;
}

export function Column({ column, cards, phase, myParticipantId, hostId, canVote, privacyMode, onSend }: ColumnProps) {
  const cssColor = COLUMN_CSS_MAP[column.color] ?? 'var(--neon-mint)';
  const cardsEndRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Sort by votes (descending) in discuss/actions phases
  const sortedCards =
    phase === 'discuss' || phase === 'actions'
      ? [...cards].sort((a, b) => b.votes - a.votes)
      : cards;

  // Auto-scroll to bottom when cards change
  useEffect(() => {
    if (cardsEndRef.current && phase === 'write') {
      cardsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [cards.length, phase]);

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span className={styles.title} style={{ color: cssColor }}>
          {column.label}
        </span>
        <div className={styles.countArea}>
          <span className={styles.count}>{cards.length}</span>
        </div>
      </div>

      <div className={styles.cards} ref={cardsContainerRef}>
        {sortedCards.length === 0 && phase === 'write' && (
          <div className={styles.emptyState}>No cards yet. Start typing below.</div>
        )}

        {sortedCards.map((card) => {
          const isOwner = card.authorId === myParticipantId || hostId === myParticipantId;

          return (
            <StickyNote
              key={card.id}
              card={card}
              columnColor={column.color}
              phase={phase}
              canVote={canVote}
              canDelete={isOwner && phase === 'write'}
              canEdit={isOwner && phase === 'write'}
              isPrivate={privacyMode && card.authorId !== myParticipantId}
              onSend={onSend}
            />
          );
        })}

        <div ref={cardsEndRef} />
      </div>

      {phase === 'write' && (
        <div className={styles.footer}>
          <CardInput
            onSubmit={(text) => onSend({ type: 'addCard', columnId: column.id, text })}
          />
        </div>
      )}
    </div>
  );
}
