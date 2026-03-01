import type { Participant, RetroPhase, ClientMessage } from '../types';
import styles from './ParticipantList.module.css';

const AVATAR_COLORS = [
  '#bf00ff', '#00d4aa', '#ff6a00', '#ff00ff',
  '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface ParticipantListProps {
  participants: Participant[];
  phase: RetroPhase;
  myParticipantId: string;
  isHost: boolean;
  votesPerPerson: number;
  onSend: (msg: ClientMessage) => void;
}

function ParticipantChip({ p, isMe, isWritePhase, showVotes, votesUsed, votesPerPerson, onSend }: {
  p: Participant;
  isMe: boolean;
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
      <div className={styles.circle} style={{ background: getAvatarColor(p.id) }}>
        {getInitials(p.name)}
        <span className={`${styles.presenceDot} ${p.connected ? styles.online : styles.offline}`} />
      </div>
      <span className={styles.name}>
        {p.name}
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

export function ParticipantList({ participants, phase, myParticipantId, isHost, votesPerPerson, onSend }: ParticipantListProps) {
  const isWritePhase = phase === 'write';
  const allReady = isWritePhase && participants.every((p) => p.ready);

  const me = participants.find((p) => p.id === myParticipantId);
  const others = participants.filter((p) => p.id !== myParticipantId);

  const chipProps = (p: Participant) => ({
    p,
    isMe: p.id === myParticipantId,
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
