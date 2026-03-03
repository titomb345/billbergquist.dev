import type { Participant, ClientMessage } from '../types';
import styles from './WriteStatusBar.module.css';

interface WriteStatusBarProps {
  participants: Participant[];
  myParticipantId: string;
  privacyMode: boolean;
  allReady?: boolean;
  onSend: (msg: ClientMessage) => void;
}

export function WriteStatusBar({ participants, myParticipantId, privacyMode, allReady: allReadyProp, onSend }: WriteStatusBarProps) {
  const me = participants.find((p) => p.id === myParticipantId);
  const isReady = me?.ready ?? false;
  const readyCount = participants.filter((p) => p.ready).length;
  const allReady = allReadyProp ?? participants.every((p) => p.ready);

  return (
    <div className={`${styles.bar}${allReady ? ` ${styles.barAllReady}` : ''}`}>
      <span className={privacyMode ? styles.privacyHidden : styles.privacyVisible}>
        {privacyMode ? 'Cards hidden from others' : 'Cards visible to everyone'}
      </span>

      <div className={styles.readySection}>
        {participants.length > 1 && (
          <span className={allReady ? styles.readyCountAll : styles.readyCount}>
            {readyCount}/{participants.length} ready
          </span>
        )}
        <button
          className={isReady ? styles.doneBtn : styles.doneBtnInactive}
          onClick={() => onSend({ type: 'toggleReady' })}
          aria-label={isReady ? 'Mark as still writing' : 'Mark as done writing'}
          aria-pressed={isReady}
        >
          {isReady ? '\u2713 Done' : 'I\'m done'}
        </button>
      </div>
    </div>
  );
}
