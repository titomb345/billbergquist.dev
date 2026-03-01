import { useState, useRef, useEffect } from 'react';
import { COLUMN_CSS_MAP } from '../constants';
import styles from './PendingNote.module.css';

export interface PendingCard {
  id: string;
  columnId: string;
  text: string;
}

interface PendingNoteProps {
  card: PendingCard;
  columnColor: string;
  onSubmit: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function PendingNote({ card, columnColor, onSubmit, onDelete, onEdit }: PendingNoteProps) {
  const cssColor = COLUMN_CSS_MAP[columnColor] ?? 'var(--neon-mint)';
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
      onEdit(card.id, trimmed);
    } else {
      setEditText(card.text);
    }
    setEditing(false);
  };

  return (
    <div
      className={styles.card}
      style={{ '--border-color': cssColor } as React.CSSProperties}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          className={styles.editArea}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          maxLength={500}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === 'Escape') {
              setEditText(card.text);
              setEditing(false);
            }
          }}
        />
      ) : (
        <div className={styles.text} onClick={() => setEditing(true)}>
          {card.text}
        </div>
      )}

      <div className={styles.actions}>
        <span className={styles.draftLabel}>draft</span>
        <div className={styles.actionBtns}>
          <button className={styles.deleteBtn} onClick={() => onDelete(card.id)}>
            discard
          </button>
          <button className={styles.submitBtn} onClick={() => onSubmit(card.id)}>
            send
          </button>
        </div>
      </div>
    </div>
  );
}
