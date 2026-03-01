import { useState, useRef, useEffect } from 'react';
import type { Card, ClientMessage, RetroPhase } from '../types';
import { COLUMN_CSS_MAP } from '../constants';
import styles from './StickyNote.module.css';

const AVATAR_COLORS = [
  '#bf00ff', '#00d4aa', '#ff6a00', '#ff00ff',
  '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
];

function getAuthorColor(authorId: string): string {
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
  const glowMap: Record<string, string> = {
    mint: 'var(--neon-mint-glow)',
    magenta: 'var(--neon-magenta-glow)',
    orange: 'var(--neon-orange-glow)',
  };
  const glowColor = glowMap[columnColor] ?? 'var(--neon-mint-glow)';

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
    >
      {canDelete && (
        <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onSend({ type: 'deleteCard', cardId: card.id }); }}>
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
            <span className={styles.authorDot} style={{ background: getAuthorColor(card.authorId) }} />
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
          >
            -1
          </button>
        )}
      </div>
    </div>
  );
}
