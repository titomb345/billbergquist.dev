import { useState, useEffect, useRef } from 'react';
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

function playTick(pitch: number) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = pitch;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not available
  }
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not available
  }
}

interface TimerProps {
  timerEnd: number | null;
  isHost: boolean;
  defaultDuration: number;
  muted?: boolean;
  onToggleMute?: () => void;
  onSend: (msg: ClientMessage) => void;
}

export function Timer({ timerEnd, isHost, defaultDuration, muted = false, onToggleMute, onSend }: TimerProps) {
  const { secondsRemaining, isExpired, isRunning } = useTimer(timerEnd);
  const [showPicker, setShowPicker] = useState(false);
  const [flash, setFlash] = useState(false);
  const prevExpiredRef = useRef(false);
  const prevSecondsRef = useRef(secondsRemaining);

  // Countdown ticks for the last 5 seconds
  useEffect(() => {
    if (
      !muted &&
      isRunning &&
      secondsRemaining >= 1 &&
      secondsRemaining <= 5 &&
      secondsRemaining < prevSecondsRef.current
    ) {
      playTick(600);
    }
    prevSecondsRef.current = secondsRemaining;
  }, [secondsRemaining, isRunning, muted]);

  // Fire alert exactly once when timer transitions to expired
  useEffect(() => {
    if (isExpired && !prevExpiredRef.current) {
      if (!muted) playChime();
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(timeout);
    }
    prevExpiredRef.current = isExpired;
  }, [isExpired]);

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
      {flash && <div className={styles.flash} aria-hidden="true" />}
      {onToggleMute && (
        <button
          className={styles.muteBtn}
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute timer sounds' : 'Mute timer sounds'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
        </button>
      )}
      <span
        className={`${styles.display} ${isRunning || isExpired ? colorClass : styles.idle}`}
        role="timer"
        aria-live="off"
        aria-label={isExpired ? "Time's up" : isRunning ? `${minutes} minutes ${seconds} seconds remaining` : 'Timer not started'}
      >
        {isExpired ? "Time's up" : isRunning ? display : `${Math.floor(defaultDuration / 60)}:${(defaultDuration % 60).toString().padStart(2, '0')}`}
      </span>

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
