import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const confirmClass =
    variant === 'danger'
      ? styles.confirmBtnDanger
      : variant === 'warning'
        ? styles.confirmBtnWarning
        : styles.confirmBtn;

  return createPortal(
    <div className={styles.backdrop} onClick={onCancel}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h3 id="confirm-title" className={styles.title}>{title}</h3>
        <p id="confirm-message" className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button ref={confirmRef} className={confirmClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
