import { useState } from 'react';
import type { RetroPhase, ClientMessage, RoomState } from '../types';
import { PHASE_ORDER, PHASE_LABELS, WORKFLOW_PHASES } from '../constants';
import { ExportMenu } from './ExportMenu';
import { ConfirmDialog } from './ConfirmDialog';
import styles from './PhaseBar.module.css';

interface PhaseBarProps {
  currentPhase: RetroPhase;
  roomCode: string;
  isHost: boolean;
  connectionStatus: string;
  privacyMode: boolean;
  room: RoomState;
  allReady?: boolean;
  onSend: (msg: ClientMessage) => void;
}

export function PhaseBar({ currentPhase, roomCode, isHost, connectionStatus, privacyMode, room, allReady, onSend }: PhaseBarProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const [copied, setCopied] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'resetVotes' | 'back' | 'endRetro' | null>(null);

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

  const handleBackClick = () => {
    if (currentPhase === 'vote' || currentPhase === 'discuss') {
      setConfirmAction('back');
    } else {
      handlePrevPhase();
    }
  };

  const handleResetClick = () => {
    setConfirmAction('resetVotes');
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

  const workflowIndex = WORKFLOW_PHASES.indexOf(currentPhase as typeof WORKFLOW_PHASES[number]);

  const hostControls = isHost && currentPhase !== 'summary' && (
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
            onClick={handleResetClick}
            disabled={room.votes.length === 0}
            aria-label="Reset all votes"
          >
            Reset
          </button>
        </>
      )}
      {currentIndex > 1 && (
        <button className={styles.ctrlBtn} onClick={handleBackClick} aria-label={`Go back to ${PHASE_LABELS[PHASE_ORDER[currentIndex - 1]]} phase`}>
          Back
        </button>
      )}
      {currentPhase === 'actions' ? (
        <button
          className={styles.ctrlBtnPrimary}
          onClick={() => setConfirmAction('endRetro')}
          aria-label="End retro and show summary"
        >
          End Retro
        </button>
      ) : currentIndex < WORKFLOW_PHASES.length - 1 && (
        <button
          className={`${styles.ctrlBtnPrimary}${allReady ? ` ${styles.ctrlBtnPulse}` : ''}`}
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
            {WORKFLOW_PHASES.map((phase, i) => {
              const stepperIndex = workflowIndex === -1 ? WORKFLOW_PHASES.length : workflowIndex;
              let dotClass = styles.stepDotFuture;
              let status = 'upcoming';
              if (i === stepperIndex) { dotClass = styles.stepDotActive; status = 'current'; }
              else if (i < stepperIndex) { dotClass = styles.stepDotDone; status = 'completed'; }

              let lineClass = styles.stepLine;
              if (i < stepperIndex) lineClass = styles.stepLineDone;
              else if (i === stepperIndex) lineClass = styles.stepLineActive;

              return (
                <div key={phase} className={styles.step}>
                  {i > 0 && <div className={lineClass} aria-hidden="true" />}
                  <div className={dotClass} title={PHASE_LABELS[phase]} aria-label={`${PHASE_LABELS[phase]} phase (${status})`} aria-current={i === stepperIndex ? 'step' : undefined}>
                    {i < stepperIndex ? '\u2713' : STEP_ICONS[phase]}
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
      {isHost && currentPhase !== 'summary' && <div className={styles.mobileControls}>{hostControls}</div>}

      {confirmAction === 'resetVotes' && (
        <ConfirmDialog
          title="Reset all votes?"
          message="This will clear every participant's votes. This action cannot be undone."
          confirmLabel="Reset"
          variant="danger"
          onConfirm={() => { onSend({ type: 'resetVotes' }); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'back' && (
        <ConfirmDialog
          title="Go back?"
          message={`Going back to the ${PHASE_LABELS[PHASE_ORDER[currentIndex - 1]]} phase will reset progress in this phase.`}
          confirmLabel="Go back"
          variant="warning"
          onConfirm={() => { handlePrevPhase(); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'endRetro' && (
        <ConfirmDialog
          title="End this retro?"
          message="This will show the summary screen to all participants. This action cannot be undone."
          confirmLabel="End Retro"
          variant="warning"
          onConfirm={() => { onSend({ type: 'movePhase', phase: 'summary' }); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
