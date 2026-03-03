import { useState } from 'react';
import type { RetroPhase, ClientMessage, RoomState } from '../types';
import { PHASE_ORDER, PHASE_LABELS } from '../constants';
import { ExportMenu } from './ExportMenu';
import styles from './PhaseBar.module.css';

interface PhaseBarProps {
  currentPhase: RetroPhase;
  roomCode: string;
  isHost: boolean;
  connectionStatus: string;
  privacyMode: boolean;
  room: RoomState;
  onSend: (msg: ClientMessage) => void;
}

export function PhaseBar({ currentPhase, roomCode, isHost, connectionStatus, privacyMode, room, onSend }: PhaseBarProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const [copied, setCopied] = useState(false);

  const handleNextPhase = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < PHASE_ORDER.length) {
      onSend({ type: 'movePhase', phase: PHASE_ORDER[nextIndex] });
    }
  };

  const handlePrevPhase = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      onSend({ type: 'movePhase', phase: PHASE_ORDER[prevIndex] });
    }
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}/retro/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STEP_ICONS: Record<string, string> = {
    lobby: 'L',
    write: 'W',
    group: 'G',
    vote: 'V',
    discuss: 'D',
    actions: 'A',
  };

  const hostControls = isHost && (
    <div className={styles.controls}>
      {currentPhase === 'write' && (
        <button className={styles.ctrlBtn} onClick={() => onSend({ type: 'togglePrivacy' })} aria-label={privacyMode ? 'Reveal cards to everyone' : 'Hide cards from others'}>
          {privacyMode ? 'Reveal' : 'Hide'}
        </button>
      )}
      {currentPhase === 'vote' && (
        <>
          <div className={styles.voteSetting}>
            <span className={styles.voteSettingLabel}>Votes</span>
            <button
              className={styles.voteSettingBtn}
              onClick={() =>
                onSend({
                  type: 'updateSettings',
                  settings: { votesPerPerson: Math.max(1, room.settings.votesPerPerson - 1) },
                })
              }
              aria-label="Decrease votes per person"
            >
              -
            </button>
            <span className={styles.voteSettingValue} aria-label={`${room.settings.votesPerPerson} votes per person`}>{room.settings.votesPerPerson}</span>
            <button
              className={styles.voteSettingBtn}
              onClick={() =>
                onSend({
                  type: 'updateSettings',
                  settings: { votesPerPerson: Math.min(20, room.settings.votesPerPerson + 1) },
                })
              }
              aria-label="Increase votes per person"
            >
              +
            </button>
          </div>
          <button
            className={styles.ctrlBtn}
            onClick={() => onSend({ type: 'resetVotes' })}
            disabled={room.votes.length === 0}
            aria-label="Reset all votes"
          >
            Reset
          </button>
        </>
      )}
      {currentIndex > 0 && (
        <button className={styles.ctrlBtn} onClick={handlePrevPhase} aria-label={`Go back to ${PHASE_LABELS[PHASE_ORDER[currentIndex - 1]]} phase`}>
          Back
        </button>
      )}
      {currentIndex < PHASE_ORDER.length - 1 && (
        <button
          className={styles.ctrlBtnPrimary}
          onClick={handleNextPhase}
          disabled={currentPhase === 'write' && room.cards.length === 0}
          aria-label={`Advance to ${PHASE_LABELS[PHASE_ORDER[currentIndex + 1]]} phase`}
        >
          Next
        </button>
      )}
    </div>
  );

  return (
    <div className={styles.bar}>
      <div className={styles.topRow}>
        <div className={styles.left}>
          <span
            className={`${styles.connDot} ${connectionStatus === 'connected' ? styles.connOnline : styles.connOffline}`}
            role="status"
            aria-label={connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          />

          <div className={styles.roomBadge} onClick={copyRoomLink} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyRoomLink(); } }} title="Copy room link" role="button" tabIndex={0} aria-label={`Room ${roomCode}. Click to copy invite link`}>
            <span className={styles.roomBadgeCode}>{roomCode}</span>
            <span className={`${styles.roomBadgeIcon} ${copied ? styles.copied : ''}`}>
              {copied ? '\u2713' : '\u2398'}
            </span>
          </div>

          <ExportMenu room={room} />
        </div>

        <div className={styles.center}>
          <nav className={styles.stepper} aria-label="Retro phases">
            {PHASE_ORDER.map((phase, i) => {
              let dotClass = styles.stepDotFuture;
              let status = 'upcoming';
              if (phase === currentPhase) { dotClass = styles.stepDotActive; status = 'current'; }
              else if (i < currentIndex) { dotClass = styles.stepDotDone; status = 'completed'; }

              let lineClass = styles.stepLine;
              if (i < currentIndex) lineClass = styles.stepLineDone;
              else if (i === currentIndex) lineClass = styles.stepLineActive;

              return (
                <div key={phase} className={styles.step}>
                  {i > 0 && <div className={lineClass} aria-hidden="true" />}
                  <div className={dotClass} title={PHASE_LABELS[phase]} aria-label={`${PHASE_LABELS[phase]} phase (${status})`} aria-current={phase === currentPhase ? 'step' : undefined}>
                    {i < currentIndex ? '\u2713' : STEP_ICONS[phase]}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Desktop: controls inline in top row */}
        <div className={styles.right}>{hostControls}</div>
      </div>

      {/* Mobile: controls on their own row */}
      {isHost && <div className={styles.mobileControls}>{hostControls}</div>}
    </div>
  );
}
