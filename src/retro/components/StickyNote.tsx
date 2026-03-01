import { useState, useRef, useEffect } from 'react';
import type { Card, ClientMessage, RetroPhase } from '../types';
import { COLUMN_CSS_MAP } from '../constants';
import { getAvatarColor } from '../utils/avatar';
import styles from './StickyNote.module.css';

const COLUMN_GLOW_MAP: Record<string, string> = {
  mint: 'var(--neon-mint-glow)',
  magenta: 'var(--neon-magenta-glow)',
  orange: 'var(--neon-orange-glow)',
};

interface StickyNoteProps {
  card: Card;
  columnColor: string;
  phase: RetroPhase;
  canVote: boolean;
  canDelete: boolean;
  canEdit?: boolean;
  isPrivate: boolean;
  onSend: (msg: ClientMessage) => void;
  myVoteCount?: number;
  hideVotes?: boolean;
}

export function StickyNote({ card, columnColor, phase, canVote, canDelete, canEdit = false, isPrivate, onSend, myVoteCount = 0, hideVotes = false }: StickyNoteProps) {
  const cssColor = COLUMN_CSS_MAP[columnColor] ?? 'var(--neon-mint)';
  const glowColor = COLUMN_GLOW_MAP[columnColor] ?? 'var(--neon-mint-glow)';

  const isVotable = phase === 'vote' && !hideVotes;
  const showVoteInfo = (phase === 'vote' || phase === 'discuss') && !hideVotes;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(card.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== card.text) {
      onSend({ type: 'editCard', cardId: card.id, text: trimmed });
    }
    setEditing(false);
  };

  const handleClick = () => {
    if (isVotable && canVote) {
      onSend({ type: 'vote', cardId: card.id });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isVotable) return;
    e.preventDefault();
    if (myVoteCount > 0) {
      onSend({ type: 'unvote', cardId: card.id });
    }
  };

  const handleTextClick = (e: React.MouseEvent) => {
    if (canEdit && !isPrivate) {
      e.stopPropagation();
      setEditText(card.text);
      setEditing(true);
    }
  };

  return (
    <div
      className={styles.card}
      style={
        {
          '--border-color': cssColor,
          '--glow-color': glowColor,
          cursor: isVotable ? 'pointer' : undefined,
        } as React.CSSProperties
      }
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={(e) => {
        if (isVotable && e.key === 'Enter') {
          e.preventDefault();
          if (canVote) onSend({ type: 'vote', cardId: card.id });
        }
        if (isVotable && (e.key === 'Backspace' || e.key === 'Delete') && myVoteCount > 0) {
          e.preventDefault();
          onSend({ type: 'unvote', cardId: card.id });
        }
      }}
      tabIndex={isVotable ? 0 : undefined}
      role={isVotable ? 'button' : undefined}
      aria-label={isVotable ? `${card.text}. ${card.votes} votes. Press Enter to vote, Backspace to unvote.` : undefined}
    >
      {canDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onSend({ type: 'deleteCard', cardId: card.id }); }}
          aria-label="Delete card"
        >
          x
        </button>
      )}

      {editing ? (
        <textarea
          ref={textareaRef}
          className={styles.editTextarea}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
            if (e.key === 'Escape') { setEditing(false); }
          }}
          rows={2}
          maxLength={500}
        />
      ) : (
        <div
          className={isPrivate ? styles.textPrivate : canEdit ? styles.textEditable : styles.text}
          onClick={handleTextClick}
        >
          {isPrivate ? card.text.replace(/\S/g, '\u2022') : card.text}
        </div>
      )}

      <div className={styles.footer}>
        {card.authorName && (
          <span className={styles.author}>
            <span className={styles.authorDot} style={{ background: getAvatarColor(card.authorId) }} />
            {card.authorName}
          </span>
        )}

        {showVoteInfo && card.votes > 0 && (
          <span className={styles.voteBadge}>
            {card.votes} {card.votes === 1 ? 'vote' : 'votes'}
            {myVoteCount > 0 && (
              <span className={styles.myVotesInline}> ({myVoteCount} mine)</span>
            )}
          </span>
        )}

        {isVotable && myVoteCount > 0 && (
          <button
            className={styles.unvoteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onSend({ type: 'unvote', cardId: card.id });
            }}
            aria-label={`Remove vote (${myVoteCount} of your votes on this card)`}
          >
            -1
          </button>
        )}
      </div>
    </div>
  );
}
