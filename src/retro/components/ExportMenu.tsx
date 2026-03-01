import { useState, useRef, useEffect, useCallback } from 'react';
import type { RoomState } from '../types';
import { downloadMarkdown, downloadJson, copyMarkdownToClipboard } from '../utils/exportRetro';
import styles from './ExportMenu.module.css';

interface ExportMenuProps {
  room: RoomState;
}

export function ExportMenu({ room }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }

      // Trap focus within the dropdown
      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>('button');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!menuRef.current) return;
        const buttons = Array.from(menuRef.current.querySelectorAll<HTMLElement>('button'));
        const currentIndex = buttons.indexOf(document.activeElement as HTMLElement);
        const next = e.key === 'ArrowDown'
          ? buttons[(currentIndex + 1) % buttons.length]
          : buttons[(currentIndex - 1 + buttons.length) % buttons.length];
        next.focus();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    // Focus first option when menu opens
    requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>('button')?.focus();
    });

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, closeMenu]);

  const handleCopy = () => {
    copyMarkdownToClipboard(room).then(() => {
      setOpen(false);
      setToast('Copied!');
      setTimeout(() => setToast(null), 1500);
    });
  };

  const handleDownloadMd = () => {
    downloadMarkdown(room);
    closeMenu();
  };

  const handleDownloadJson = () => {
    downloadJson(room);
    closeMenu();
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Export retro results"
      >
        Export
      </button>

      {open && (
        <div className={styles.dropdown} ref={menuRef} role="menu" aria-label="Export options">
          <button className={styles.option} onClick={handleCopy} role="menuitem">
            Copy to clipboard
            <span className={styles.optionHint}>Markdown format</span>
          </button>
          <button className={styles.option} onClick={handleDownloadMd} role="menuitem">
            Download .md
            <span className={styles.optionHint}>Markdown file</span>
          </button>
          <button className={styles.option} onClick={handleDownloadJson} role="menuitem">
            Download .json
            <span className={styles.optionHint}>Structured data</span>
          </button>
        </div>
      )}

      {toast && <div className={styles.toast} role="status" aria-live="polite">{toast}</div>}
    </div>
  );
}
