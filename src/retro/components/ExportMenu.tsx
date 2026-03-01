import { useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCopy = () => {
    copyMarkdownToClipboard(room).then(() => {
      setOpen(false);
      setToast('Copied!');
      setTimeout(() => setToast(null), 1500);
    });
  };

  const handleDownloadMd = () => {
    downloadMarkdown(room);
    setOpen(false);
  };

  const handleDownloadJson = () => {
    downloadJson(room);
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        Export
      </button>

      {open && (
        <div className={styles.dropdown}>
          <button className={styles.option} onClick={handleCopy}>
            Copy to clipboard
            <span className={styles.optionHint}>Markdown format</span>
          </button>
          <button className={styles.option} onClick={handleDownloadMd}>
            Download .md
            <span className={styles.optionHint}>Markdown file</span>
          </button>
          <button className={styles.option} onClick={handleDownloadJson}>
            Download .json
            <span className={styles.optionHint}>Structured data</span>
          </button>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
