import { ReactNode } from 'react';
import styles from './ArcadeCabinet.module.css';

interface ArcadeCabinetProps {
  children: ReactNode;
  title: string;
  color?: 'mint' | 'magenta' | 'purple' | 'orange';
  onPause?: () => void;
  isPaused?: boolean;
  onReset?: () => void;
}

function ArcadeCabinet({
  children,
  title,
  color = 'mint',
  onPause,
  isPaused,
  onReset,
}: ArcadeCabinetProps) {
  const colorClass = styles[`color${color.charAt(0).toUpperCase()}${color.slice(1)}`];

  return (
    <div className={`${styles.cabinet} ${colorClass}`}>
      {/* Marquee Header */}
      <div className={styles.marquee}>
        <h1 className={styles.marqueeTitle}>{title}</h1>
        <div className={styles.freePlay}>FREE PLAY</div>
      </div>

      {/* T-Molding Trim */}
      <div className={styles.tMolding} />

      {/* Screen Frame with Speaker Grilles */}
      <div className={styles.screenFrame}>
        {/* CRT Screen */}
        <div className={styles.screen}>
          {/* Screen effects */}
          <div className={styles.scanlines} />
          <div className={styles.movingScanline} />
          <div className={styles.vignette} />

          {/* Actual content */}
          <div className={styles.screenContent}>{children}</div>
        </div>

        {/* Power LED */}
        <div className={styles.powerLed} />
      </div>

      {/* Control Panel */}
      <div className={`${styles.controlPanel} ${onPause && onReset ? styles.controlPanelSpaced : ''}`}>
        {onPause && (
          <button
            className={`${styles.arcadeButton} ${styles.arcadeButtonPause} ${isPaused ? styles.arcadeButtonActive : ''}`}
            onClick={onPause}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="4" width="5" height="16" rx="1" />
              <rect x="14" y="4" width="5" height="16" rx="1" />
            </svg>
          </button>
        )}
        {onReset && (
          <button
            className={`${styles.arcadeButton} ${styles.arcadeButtonReset}`}
            onClick={onReset}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ArcadeCabinet;
