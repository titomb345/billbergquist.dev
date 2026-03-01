import type { Participant, RetroPhase, ClientMessage } from '../types';
import { getAvatarColor, getInitials } from '../utils/avatar';
import styles from './ParticipantList.module.css';

interface ParticipantListProps {
  participants: Participant[];
  phase: RetroPhase;
  myParticipantId: string;
  myAvatarUrl?: string;
  isHost: boolean;
  votesPerPerson: number;
  onSend: (msg: ClientMessage) => void;
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0];
}

function ParticipantChip({ p, isMe, avatarUrl, isWritePhase, showVotes, votesUsed, votesPerPerson, onSend }: {
  p: Participant;
  isMe: boolean;
  avatarUrl?: string;
  isWritePhase: boolean;
  showVotes: boolean;
  votesUsed: number;
  votesPerPerson: number;
  onSend: (msg: ClientMessage) => void;
}) {
  return (
    <div
      className={`${styles.avatar} ${isWritePhase && isMe ? styles.avatarClickable : ''}`}
      onClick={isWritePhase && isMe ? () => onSend({ type: 'toggleReady' }) : undefined}
    >
      {avatarUrl ? (
        <div className={styles.circle}>
          <img src={avatarUrl} alt="" className={styles.circleImg} width={26} height={26} />
          <span className={`${styles.presenceDot} ${p.connected ? styles.online : styles.offline}`} />
        </div>
      ) : (
        <div className={styles.circle} style={{ background: getAvatarColor(p.id) }}>
          {getInitials(p.name)}
          <span className={`${styles.presenceDot} ${p.connected ? styles.online : styles.offline}`} />
        </div>
      )}
      <span className={styles.name}>
        {getFirstName(p.name)}
        {isMe && <span className={styles.you}> (you)</span>}
      </span>
      {p.isHost && <span className={styles.hostTag}>host</span>}
      {isWritePhase && p.ready && (
        <span className={styles.readyBadge}>{'\u2713'}</span>
      )}
      {showVotes && (
        <span className={p.votesRemaining === 0 ? styles.voteBadgeDone : styles.voteBadge}>
          {votesUsed}/{votesPerPerson}
        </span>
      )}
    </div>
  );
}

export function ParticipantList({ participants, phase, myParticipantId, myAvatarUrl, isHost, votesPerPerson, onSend }: ParticipantListProps) {
  const isWritePhase = phase === 'write';
  const allReady = isWritePhase && participants.every((p) => p.ready);

  const me = participants.find((p) => p.id === myParticipantId);
  const others = participants.filter((p) => p.id !== myParticipantId);

  const chipProps = (p: Participant) => ({
    p,
    isMe: p.id === myParticipantId,
    avatarUrl: p.id === myParticipantId ? myAvatarUrl : undefined,
    isWritePhase,
    showVotes: phase === 'vote' && (p.id === myParticipantId || isHost),
    votesUsed: votesPerPerson - p.votesRemaining,
    votesPerPerson,
    onSend,
  });

  return (
    <div className={styles.list}>
      {me && (
        <div className={styles.left}>
          <ParticipantChip key={me.id} {...chipProps(me)} />
        </div>
      )}
      <div className={styles.right}>
        {others.map((p) => (
          <ParticipantChip key={p.id} {...chipProps(p)} />
        ))}
        {isWritePhase && allReady && (
          <span className={styles.allReadyTag}>All ready!</span>
        )}
      </div>
    </div>
  );
}
