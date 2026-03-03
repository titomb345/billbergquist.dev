import { useState, useMemo, useEffect } from 'react';
import type { RoomState, ClientMessage } from '../types';
import { PhaseBar } from './PhaseBar';
import { ParticipantList } from './ParticipantList';
import { WriteStatusBar } from './WriteStatusBar';
import { Column } from './Column';
import { Timer } from './Timer';
import { ActionItems } from './ActionItems';
import { GroupPhase } from './GroupPhase';
import { CardGroupStack } from './CardGroupStack';
import { StickyNote } from './StickyNote';
import { computeVotableUnits, sortVotableUnits } from '../utils/votableUnits';
import { getAvatarColor, getInitials } from '../utils/avatar';
import styles from './Board.module.css';

interface BoardProps {
  room: RoomState;
  isHost: boolean;
  myParticipantId: string;
  myAvatarUrl?: string;
  connectionStatus: string;
  onSend: (msg: ClientMessage) => void;
}

export function Board({ room, isHost, myParticipantId, myAvatarUrl, connectionStatus, onSend }: BoardProps) {
  const me = room.participants.find((p) => p.id === myParticipantId);
  const canVote = (me?.votesRemaining ?? 0) > 0;
  const [copied, setCopied] = useState(false);

  // Hide site navbar and footer when retro board is active
  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  const copyLink = () => {
    const url = `${window.location.origin}/retro/${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.board}>
      <PhaseBar
        currentPhase={room.phase}
        roomCode={room.roomCode}
        isHost={isHost}
        connectionStatus={connectionStatus}
        privacyMode={room.privacyMode}
        room={room}
        onSend={onSend}
      />

      {room.phase !== 'lobby' && (
        <ParticipantList
          participants={room.participants}
          phase={room.phase}
          myParticipantId={myParticipantId}
          myAvatarUrl={myAvatarUrl}
          isHost={isHost}
          votesPerPerson={room.settings.votesPerPerson}
          onSend={onSend}
        />
      )}

      {room.phase !== 'lobby' && room.phase !== 'actions' && (
        <Timer
          timerEnd={room.timerEnd}
          isHost={isHost}
          defaultDuration={room.settings.timerDuration}
          onSend={onSend}
        />
      )}

      {room.phase === 'lobby' && (
        <div className={styles.lobby}>
          <span className={styles.lobbyLabel}>
            Room Code
          </span>

          <div className={styles.codeBoxes}>
            {room.roomCode.split('').map((char, i) => (
              <div key={i} className={styles.codeLetter}>{char}</div>
            ))}
          </div>

          <p className={styles.lobbyHint}>Share this code with your team to join</p>

          <button
            className={copied ? styles.copyBtnCopied : styles.copyBtn}
            onClick={copyLink}
          >
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>

          <div className={styles.lobbyParticipants}>
            {room.participants.map((p) => {
              const isMe = p.id === myParticipantId;
              return (
                <div
                  key={p.id}
                  className={styles.lobbyAvatar}
                  style={isMe && myAvatarUrl ? undefined : { background: getAvatarColor(p.id) }}
                  title={p.name}
                >
                  {isMe && myAvatarUrl ? (
                    <img src={myAvatarUrl} alt="" className={styles.lobbyAvatarImg} width={36} height={36} />
                  ) : (
                    getInitials(p.name)
                  )}
                  <span className={`${styles.lobbyPresenceDot} ${p.connected ? styles.lobbyOnline : styles.lobbyOffline}`} />
                  <span className={styles.lobbyAvatarName}>
                    {p.name}
                    {p.isHost && <span className={styles.lobbyHostTag}>host</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {isHost && (
            <button
              className={styles.startBtn}
              onClick={() => onSend({ type: 'movePhase', phase: 'write' })}
            >
              Start Retro
            </button>
          )}

          {!isHost && (
            <p className={styles.lobbyHint}>
              Waiting for host to start
              <span className={styles.waitingDots}>
                <span /><span /><span />
              </span>
            </p>
          )}
        </div>
      )}

      {room.phase === 'write' && (
        <>
          <div className={styles.columns}>
            {room.columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                cards={room.cards.filter((c) => c.columnId === col.id)}
                phase={room.phase}
                myParticipantId={myParticipantId}
                hostId={room.hostId}
                canVote={canVote}
                privacyMode={room.privacyMode}
                onSend={onSend}
              />
            ))}
          </div>
          <WriteStatusBar
            participants={room.participants}
            myParticipantId={myParticipantId}
            privacyMode={room.privacyMode}
            onSend={onSend}
          />
        </>
      )}

      {room.phase === 'group' && (
        <GroupPhase
          cards={room.cards}
          groups={room.groups ?? []}
          columns={room.columns}
          onSend={onSend}
        />
      )}

      {room.phase === 'vote' && (
        <p className={styles.mobileVoteHint}>Tap a card to vote. Use the -1 button to unvote. On keyboard: Enter to vote, Backspace to unvote.</p>
      )}

      {(room.phase === 'vote' || room.phase === 'discuss') && (
        <div className={styles.votePhase}>
          <VoteDiscussList
            room={{ ...room, groups: room.groups ?? [] }}
            myParticipantId={myParticipantId}
            canVote={canVote}
            isHost={isHost}
            onSend={onSend}
          />
        </div>
      )}

      {room.phase === 'actions' && (
        <ActionItems items={room.actionItems} participants={room.participants} onSend={onSend} />
      )}

    </div>
  );
}

// ── Unified vote/discuss list ──

interface VoteDiscussListProps {
  room: RoomState;
  myParticipantId: string;
  canVote: boolean;
  isHost: boolean;
  onSend: (msg: ClientMessage) => void;
}

function getUnitId(unit: { type: 'single'; card: { id: string } } | { type: 'group'; group: { id: string } }): string {
  return unit.type === 'group' ? unit.group.id : unit.card.id;
}

function VoteDiscussList({ room, myParticipantId, canVote, isHost, onSend }: VoteDiscussListProps) {
  const units = useMemo(() => {
    const raw = computeVotableUnits(room.cards, room.groups);
    return room.phase === 'discuss' ? sortVotableUnits(raw) : raw;
  }, [room.cards, room.groups, room.phase]);

  const isDiscuss = room.phase === 'discuss';
  const focusedId = room.focusedItemId;
  const hasFocus = isDiscuss && focusedId != null;

  const focusIndex = hasFocus ? units.findIndex((u) => getUnitId(u) === focusedId) : -1;

  const handlePrev = () => {
    if (focusIndex > 0) {
      onSend({ type: 'focusItem', itemId: getUnitId(units[focusIndex - 1]) });
    }
  };

  const handleNext = () => {
    if (!hasFocus && units.length > 0) {
      onSend({ type: 'focusItem', itemId: getUnitId(units[0]) });
    } else if (focusIndex < units.length - 1) {
      onSend({ type: 'focusItem', itemId: getUnitId(units[focusIndex + 1]) });
    }
  };

  const handleClearFocus = () => {
    onSend({ type: 'focusItem', itemId: null });
  };

  const getColumnColor = (columnId: string) =>
    room.columns.find((c) => c.id === columnId)?.color ?? 'mint';

  return (
    <>
      {isDiscuss && isHost && (
        <div className={styles.focusControls} role="toolbar" aria-label="Discussion navigation">
          <button
            className={styles.focusBtn}
            onClick={handlePrev}
            disabled={!hasFocus || focusIndex <= 0}
            aria-label="Previous item"
          >
            {'\u25C0'} Prev
          </button>
          <span className={styles.focusCounter} aria-live="polite">
            {hasFocus ? `${focusIndex + 1} / ${units.length}` : `${units.length} items`}
          </span>
          <button
            className={styles.focusBtnPrimary}
            onClick={handleNext}
            disabled={hasFocus && focusIndex >= units.length - 1}
            aria-label={hasFocus ? 'Next item' : 'Start discussion'}
          >
            {hasFocus ? 'Next' : 'Start'} {'\u25B6'}
          </button>
          {hasFocus && (
            <button className={styles.focusBtn} onClick={handleClearFocus} aria-label="Show all items">
              Show All
            </button>
          )}
        </div>
      )}

      {isDiscuss && !isHost && hasFocus && (
        <div className={styles.focusIndicator}>
          Discussing {focusIndex + 1} of {units.length}
        </div>
      )}

      <div className={styles.voteList}>
        {units.map((unit) => {
          const unitId = getUnitId(unit);
          const dimmed = hasFocus && unitId !== focusedId;

          if (unit.type === 'group') {
            return (
              <div key={unit.group.id} className={dimmed ? styles.dimmed : undefined}>
                <CardGroupStack
                  group={unit.group}
                  cards={unit.cards}
                  columns={room.columns}
                  votes={room.votes}
                  phase={room.phase}
                  myParticipantId={myParticipantId}
                  canVote={canVote}
                  onSend={onSend}
                />
              </div>
            );
          }

          const myVoteCount = room.votes.filter(
            (v) => v.participantId === myParticipantId && v.cardId === unit.card.id,
          ).length;

          return (
            <div key={unit.card.id} className={dimmed ? styles.dimmed : undefined}>
              <StickyNote
                card={unit.card}
                columnColor={getColumnColor(unit.card.columnId)}
                phase={room.phase}
                canVote={canVote}
                canDelete={false}
                isPrivate={false}
                myVoteCount={myVoteCount}
                onSend={onSend}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
