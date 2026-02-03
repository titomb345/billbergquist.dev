import { ReactNode } from 'react';
import styles from './ArcadeCabinet.module.css';

interface ArcadeCabinetProps {
  children: ReactNode;
  title: string;
  color?: 'mint' | 'magenta' | 'purple' | 'orange';
  onBack?: () => void;
  onReset?: () => void;
  resetLabel?: string;
}

function ArcadeCabinet({
  children,
  title,
  color = 'mint',
  onBack,
  onReset,
  resetLabel = 'RESET',
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
      <div className={`${styles.controlPanel} ${onBack && onReset ? styles.controlPanelSpaced : ''}`}>
        {onBack && (
          <button
            className={styles.backButton}
            onClick={onBack}
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
        )}
        {onReset && (
          <button
            className={styles.resetButton}
            onClick={onReset}
            type="button"
          >
            {resetLabel}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
