import { useState } from 'react';
import type { ClientMessage } from '../types';
import { useTimer } from '../hooks/useTimer';
import styles from './Timer.module.css';

const DURATION_OPTIONS = [
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
];

interface TimerProps {
  timerEnd: number | null;
  isHost: boolean;
  defaultDuration: number;
  onSend: (msg: ClientMessage) => void;
}

export function Timer({ timerEnd, isHost, defaultDuration, onSend }: TimerProps) {
  const { secondsRemaining, isExpired, isRunning } = useTimer(timerEnd);
  const [showPicker, setShowPicker] = useState(false);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  let colorClass = styles.safe;
  if (isExpired) colorClass = styles.expired;
  else if (secondsRemaining <= 30) colorClass = styles.danger;
  else if (secondsRemaining <= 60) colorClass = styles.warning;

  const startTimer = () => {
    onSend({ type: 'startTimer', duration: defaultDuration });
  };

  const pickDuration = (duration: number) => {
    onSend({ type: 'updateSettings', settings: { timerDuration: duration } });
    setShowPicker(false);
  };

  return (
    <div className={styles.timer}>
      {(isRunning || isExpired) && (
        <span className={`${styles.display} ${colorClass}`} role="timer" aria-live="off" aria-label={isExpired ? "Time's up" : `${minutes} minutes ${seconds} seconds remaining`}>
          {isExpired ? "Time's up" : display}
        </span>
      )}

      {isHost && (
        <>
          {!isRunning && !isExpired && (
            <div className={styles.timerControls}>
              <button
                className={styles.timerBtn}
                onClick={startTimer}
              >
                Start Timer
              </button>
              <button
                className={styles.timerPickerToggle}
                onClick={() => setShowPicker(!showPicker)}
                title="Change duration"
              >
                {showPicker ? '\u2715' : '\u25BE'}
              </button>
            </div>
          )}
          {isRunning && (
            <button className={styles.timerBtn} onClick={() => onSend({ type: 'stopTimer' })}>
              Stop
            </button>
          )}
          {isExpired && (
            <div className={styles.timerControls}>
              <button
                className={styles.timerBtn}
                onClick={startTimer}
              >
                Restart Timer
              </button>
              <button
                className={styles.timerPickerToggle}
                onClick={() => setShowPicker(!showPicker)}
                title="Change duration"
              >
                {showPicker ? '\u2715' : '\u25BE'}
              </button>
            </div>
          )}

          {showPicker && (
            <div className={styles.durationPicker}>
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  className={
                    opt.seconds === defaultDuration
                      ? styles.durationOptionActive
                      : styles.durationOption
                  }
                  onClick={() => pickDuration(opt.seconds)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
