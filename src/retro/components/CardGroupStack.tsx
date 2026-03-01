import type { Card, CardGroup, Column, ClientMessage, RetroPhase, Vote } from '../types';
import { StickyNote } from './StickyNote';
import styles from './CardGroupStack.module.css';

interface CardGroupStackProps {
  group: CardGroup;
  cards: Card[];
  columns: Column[];
  votes: Vote[];
  phase: RetroPhase;
  myParticipantId: string;
  canVote: boolean;
  onSend: (msg: ClientMessage) => void;
}

export function CardGroupStack({
  group,
  cards,
  columns,
  votes,
  phase,
  myParticipantId,
  canVote,
  onSend,
}: CardGroupStackProps) {
  // Total votes for the group (all cards share the same count)
  const totalVotes = cards[0]?.votes ?? 0;

  // How many times the current user voted on this group
  const myVoteCount = votes.filter(
    (v) => v.participantId === myParticipantId && group.cardIds.includes(v.cardId),
  ).length;

  const isVotable = phase === 'vote';

  const handleClick = () => {
    if (isVotable && canVote) {
      onSend({ type: 'vote', cardId: group.cardIds[0] });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isVotable) return;
    e.preventDefault();
    if (myVoteCount > 0) {
      const myVote = votes.find(
        (v) => v.participantId === myParticipantId && group.cardIds.includes(v.cardId),
      );
      if (myVote) onSend({ type: 'unvote', cardId: myVote.cardId });
    }
  };

  const getColumnColor = (columnId: string) =>
    columns.find((c) => c.id === columnId)?.color ?? 'mint';

  const displayLabel = group.label?.trim() || 'Group';

  return (
    <div
      className={styles.stack}
      style={{ cursor: isVotable ? 'pointer' : undefined }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.stackHeader}>
        <span className={group.label?.trim() ? styles.stackLabel : styles.stackLabelEmpty}>
          {displayLabel}
        </span>
        <div className={styles.stackMeta}>
          {(phase === 'vote' || phase === 'discuss') && totalVotes > 0 && (
            <span className={styles.voteBadge}>
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              {myVoteCount > 0 && (
                <span className={styles.myVotesInline}> ({myVoteCount} mine)</span>
              )}
            </span>
          )}
          {isVotable && myVoteCount > 0 && (
            <button
              className={styles.unvoteBtn}
              onClick={(e) => {
                e.stopPropagation();
                const myVote = votes.find(
                  (v) => v.participantId === myParticipantId && group.cardIds.includes(v.cardId),
                );
                if (myVote) onSend({ type: 'unvote', cardId: myVote.cardId });
              }}
            >
              -1
            </button>
          )}
          <span className={styles.stackCount}>{cards.length} cards</span>
        </div>
      </div>

      {cards.map((card) => (
        <StickyNote
          key={card.id}
          card={card}
          columnColor={getColumnColor(card.columnId)}
          phase={phase}
          canVote={false}
          canDelete={false}
          isPrivate={false}
          hideVotes={true}
          onSend={onSend}
        />
      ))}
    </div>
  );
}
