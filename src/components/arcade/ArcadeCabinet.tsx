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
      {/* Left edge highlight */}
      <div className={styles.edgeLeft} />
      {/* Right edge highlight */}
      <div className={styles.edgeRight} />

      {/* Marquee Header */}
      <div className={styles.marquee}>
        <span className={styles.marqueeBracket} />
        <div className={styles.marqueeInner}>
          <h1 className={styles.marqueeTitle}>{title}</h1>
          <div className={styles.freePlay}>FREE PLAY</div>
        </div>
        <span className={styles.marqueeBracket} />
      </div>

      {/* T-Molding Trim */}
      <div className={styles.tMolding} />

      {/* Screen Bezel */}
      <div className={styles.bezel}>
        {/* Corner bolts */}
        <span className={`${styles.bolt} ${styles.boltTL}`} />
        <span className={`${styles.bolt} ${styles.boltTR}`} />
        <span className={`${styles.bolt} ${styles.boltBL}`} />
        <span className={`${styles.bolt} ${styles.boltBR}`} />

        {/* Speaker grilles */}
        <div className={`${styles.speaker} ${styles.speakerLeft}`} />
        <div className={`${styles.speaker} ${styles.speakerRight}`} />

        {/* CRT Screen */}
        <div className={styles.screen}>
          <div className={styles.scanlines} />
          <div className={styles.movingScanline} />
          <div className={styles.vignette} />
          <div className={styles.screenContent}>{children}</div>
        </div>

        {/* Power LED */}
        <div className={styles.powerLed} />
      </div>

      {/* Control Panel */}
      <div className={styles.controlPanel}>
        <div className={styles.controlSurface}>
          {/* Joystick */}
          <div className={styles.joystick}>
            <div className={styles.joystickBase} />
            <div className={styles.joystickShaft} />
            <div className={styles.joystickBall} />
          </div>

          {/* Buttons */}
          <div className={styles.buttonCluster}>
            {onPause && (
              <button
                className={`${styles.arcadeButton} ${styles.arcadeButtonPause} ${isPaused ? styles.arcadeButtonActive : ''}`}
                onClick={onPause}
                type="button"
                aria-label={isPaused ? 'Resume game' : 'Pause game'}
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
                aria-label="Reset game"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coin Door */}
      <div className={styles.coinDoor}>
        <div className={styles.coinSlot}>
          <div className={styles.coinOpening} />
        </div>
        <span className={styles.coinLabel}>INSERT COIN</span>
      </div>

      {/* Kick Plate */}
      <div className={styles.kickPlate} />
    </div>
  );
}

export default ArcadeCabinet;
