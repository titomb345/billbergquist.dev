import { useState, useRef } from 'react';
import styles from './CardInput.module.css';

interface CardInputProps {
  onSubmit: (text: string) => void;
}

export function CardInput({ onSubmit }: CardInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
    textareaRef.current?.focus();
  };

  const charCount = text.length;
  const charClass =
    charCount >= 480 ? styles.charCountDanger :
    charCount >= 400 ? styles.charCountWarn :
    charCount > 0 ? styles.charCount : styles.charCountHidden;

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note..."
          maxLength={500}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <span className={charClass}>{charCount}/500</span>
      </div>

      <div className={styles.btnRow}>
        <button className={styles.addBtn} onClick={handleSubmit} disabled={!text.trim()}>
          Submit
        </button>
      </div>
    </div>
  );
}
