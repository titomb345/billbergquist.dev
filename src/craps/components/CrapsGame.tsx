import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CrapsGameState, CrapsClientMessage, BetType, DiceRoll, BetResolution } from '../types';
import { MAX_PLAYERS } from '../types';
import { POST_ROLL_DELAY_MS } from '../constants';
import { CrapsTable, getPlayerColors } from './CrapsTable';
import { Dice } from './Dice';
import { BettingControls } from './BettingControls';
import { RollHistory } from './RollHistory';
import { PayoutCard } from './PayoutCard';
import { BetResolutionOverlay } from './BetResolution';
import { Chat, type ChatMessage } from './Chat';
import { Confetti } from './Confetti';
import { PhaseAnnouncement } from './PhaseAnnouncement';
import { BalanceChange } from './BalanceChange';
import { HotStreak } from './HotStreak';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useHideHeaderFooter } from '../../shared/hooks/useHideHeaderFooter';
import styles from './CrapsGame.module.css';

interface CrapsGameProps {
  room: CrapsGameState;
  myPlayerId: string;
  connectionStatus: string;
  lastRoll: { roll: DiceRoll; resolutions: BetResolution[] } | null;
  diceAnimating: boolean;
  onSend: (msg: CrapsClientMessage) => void;
  onLeave: () => void;
  onClearLastRoll: () => void;
  onDiceAnimDone: () => void;
  chatMessages?: ChatMessage[];
}

export function CrapsGame({ room, myPlayerId, connectionStatus, lastRoll, diceAnimating, onSend, onLeave, onClearLastRoll, onDiceAnimDone, chatMessages = [] }: CrapsGameProps) {
  const me = room.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost ?? false;
  const isShooter = room.players[room.shooterIndex]?.id === myPlayerId;
  const shooter = room.players[room.shooterIndex];
  const { playDiceRoll, playWin, playBigWin, playLoss, playChipPlace, muted, toggleMute } = useSoundEffects();

  const handleChatSend = useCallback((text: string) => {
    onSend({ type: 'chat', text });
  }, [onSend]);

  // Sound effects for dice rolls and bet resolutions
  const prevLastRollRef = useRef(lastRoll);
  useEffect(() => {
    if (lastRoll && lastRoll !== prevLastRollRef.current) {
      playDiceRoll();

      // Play win/loss sound after dice animation settles (1.2s)
      const myResolutions = lastRoll.resolutions.filter((r) => r.playerId === myPlayerId);
      if (myResolutions.length > 0) {
        const myTotal = myResolutions.reduce((sum, r) => sum + r.payout, 0);
        setTimeout(() => {
          if (myTotal >= 100) playBigWin();
          else if (myTotal > 0) playWin();
          else if (myTotal < 0) playLoss();
        }, POST_ROLL_DELAY_MS);
      }
    }
    prevLastRollRef.current = lastRoll;
  }, [lastRoll, myPlayerId, playDiceRoll, playWin, playBigWin, playLoss]);

  // Confetti state: show on wins
  const showConfetti = useMemo(() => {
    if (!lastRoll) return false;
    const myTotal = lastRoll.resolutions
      .filter((r) => r.playerId === myPlayerId)
      .reduce((sum, r) => sum + r.payout, 0);
    return myTotal >= 50;
  }, [lastRoll, myPlayerId]);

  useHideHeaderFooter();

  const handlePlaceBet = useCallback((betType: BetType, amount: number, betPoint?: number) => {
    onSend({ type: 'placeBet', betType, amount, betPoint });
    playChipPlace();
  }, [onSend, playChipPlace]);

  const handleRemoveBet = useCallback((betId: string) => {
    onSend({ type: 'removeBet', betId });
  }, [onSend]);

  const handleConfirmBets = useCallback(() => {
    onSend({ type: 'confirmBets' });
  }, [onSend]);

  const handleRollDice = useCallback(() => {
    onSend({ type: 'rollDice' });
  }, [onSend]);

  const handleStartGame = useCallback(() => {
    onSend({ type: 'startGame' });
  }, [onSend]);

  const handleToggleReady = useCallback(() => {
    onSend({ type: 'toggleReady' });
  }, [onSend]);

  const playerColors = getPlayerColors();
  const myBets = useMemo(() => room.bets.filter((b) => b.playerId === myPlayerId), [room.bets, myPlayerId]);
  const [selectedChip, setSelectedChip] = useState(5);
  const [diceRolling, setDiceRolling] = useState(false);
  const handleDiceRollingChange = useCallback((rolling: boolean) => {
    setDiceRolling(rolling);
    if (!rolling) onDiceAnimDone();
  }, [onDiceAnimDone]);
  const lastRollTotal = lastRoll?.roll.total ?? null;

  const visibleRollHistory = useMemo(
    () => diceRolling ? room.rollHistory.slice(0, -1) : room.rollHistory,
    [diceRolling, room.rollHistory],
  );

  // Freeze table state while dice are animating so chips/point don't update early
  const isDiceActive = diceRolling || diceAnimating;
  const lastStableBets = useRef(room.bets);
  const lastStablePoint = useRef(room.point);
  /* eslint-disable react-hooks/refs -- intentional: freeze/read snapshot during dice animation */
  if (!isDiceActive) {
    lastStableBets.current = room.bets;
    lastStablePoint.current = room.point;
  }
  const visibleBets = isDiceActive ? lastStableBets.current : room.bets;
  const visiblePoint = isDiceActive ? lastStablePoint.current : room.point;
  /* eslint-enable react-hooks/refs */

  const [copyFeedback, setCopyFeedback] = useState(false);
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/craps/${room.roomCode}`);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }, [room.roomCode]);

  const [showPayouts, setShowPayouts] = useState(false);

  // Round countdown derived from server's roundDeadline (timer subscription)
  const [rollCountdown, setRollCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (!room.roundDeadline || room.phase === 'lobby') {
      setRollCountdown(null);
      return;
    }
    const tick = () => {
      const remaining = Math.min(60, Math.max(0, Math.ceil((room.roundDeadline! - Date.now()) / 1000)));
      setRollCountdown(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room.roundDeadline, room.phase]);


  // Lobby phase within the game room
  if (room.phase === 'lobby') {
    const connectedPlayers = room.players.filter((p) => p.connected);
    const otherPlayers = connectedPlayers.filter((p) => !p.isHost);
    const allReady = otherPlayers.length === 0 || otherPlayers.every((p) => p.ready);
    const canStart = isHost && allReady;

    return (
      <div className={styles.game}>
        <div className={styles.lobbyInGame}>
          <div className={styles.lobbyHeader}>
            <span className={styles.lobbyEyebrow}>The table is open</span>
            <h2 className={styles.lobbyTitle}>
              Room: <span className={styles.roomCode}>{room.roomCode}</span>
            </h2>
            <button
              className={`${styles.copyBtn} ${copyFeedback ? styles.copyBtnSuccess : ''}`}
              onClick={handleCopyLink}
            >
              {copyFeedback ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>

          <div className={styles.playerSlots}>
            <div className={styles.slotsHeader}>
              <span className={styles.slotsLabel}>Players</span>
              <span className={styles.slotsCount}>{connectedPlayers.length} / {MAX_PLAYERS}</span>
            </div>
            {room.players.map((player, i) => (
              <div key={player.id} className={styles.slotFilled}>
                <span className={styles.slotNumber}>{i + 1}</span>
                {player.avatarUrl && <img src={player.avatarUrl} alt="" className={styles.slotAvatar} />}
                <span className={styles.slotName}>{player.name}</span>
                {player.isHost && <span className={styles.hostBadge}>HOST</span>}
                {!player.isHost && player.ready && <span className={styles.readyBadge}>READY</span>}
                {!player.connected && <span className={styles.offlineBadge}>OFFLINE</span>}
              </div>
            ))}
          </div>

          <div className={styles.lobbyActions}>
            {!isHost && (
              <button
                className={`${styles.actionBtn} ${me?.ready ? styles.actionBtnActive : ''}`}
                onClick={handleToggleReady}
              >
                {me?.ready ? 'Not Ready' : 'Ready'}
              </button>
            )}
            {isHost && (
              <button
                className={styles.startBtn}
                onClick={handleStartGame}
                disabled={!canStart}
              >
                Start Game
              </button>
            )}
          </div>

          {isHost && otherPlayers.length > 0 && !allReady && (
            <p className={styles.hint}>Waiting for all players to ready up</p>
          )}

          <button className={styles.leaveBtn} onClick={onLeave}>
            Leave Room
          </button>
        </div>

        {/* Chat in lobby */}
        {createPortal(
          <div className={styles.floatingChat}>
            <Chat messages={chatMessages} onSend={handleChatSend} myPlayerId={myPlayerId} players={room.players} />
          </div>,
          document.body,
        )}
      </div>
    );
  }

  return (
    <div className={styles.game}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
        <div className={styles.topBarLeft}>
          <div className={styles.roomInfo}>
            <button className={styles.roomCodeBtn} onClick={handleCopyLink} title="Copy invite link">
              {copyFeedback ? 'Copied!' : room.roomCode}
            </button>
            <span className={`${styles.statusDot} ${styles[connectionStatus] ?? ''}`} />
          </div>
          <span className={styles.phaseLabel}>
            {room.point ? `Point: ${room.point}` : 'Come Out Roll'}
          </span>
          <span className={styles.shooterLabel}>
            Shooter: {shooter?.name ?? '?'}
          </span>
        </div>

        <div className={styles.topBarRight}>
          <HotStreak rollHistory={visibleRollHistory} point={room.point} />
          <button
            className={styles.payoutBtn}
            onClick={() => setShowPayouts((v) => !v)}
            title="Payouts & Odds"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.5v0m0 7V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className={`${styles.payoutBtn} ${muted ? styles.mutedBtn : ''}`}
            onClick={toggleMute}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5V2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M11 5.5l4 5M15 5.5l-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5V2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M11 5.5a3.5 3.5 0 010 5M13 3.5a6.5 6.5 0 010 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button
            className={styles.payoutBtn}
            onClick={onLeave}
            title="Leave room"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M11 11l3-3-3-3M6 8h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {me && (
            <div className={styles.balanceBar}>
              <span className={styles.balanceBarAmount}>${me.balance.toLocaleString()}</span>
              {lastRoll && (
                <BalanceChange myPlayerId={myPlayerId} resolutions={lastRoll.resolutions} />
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Players Strip — all players including current user */}
      <div className={styles.playersStrip}>
        <div className={styles.playersStripInner}>
          {room.players.map((player, idx) => {
            const isPlayerShooter = idx === room.shooterIndex;
            const isMe = player.id === myPlayerId;
            const chipColor = playerColors[idx % playerColors.length];
            return (
              <div
                key={player.id}
                className={`${styles.playerChip} ${isMe ? styles.playerChipMe : ''} ${!player.connected ? styles.playerChipOffline : ''}`}
              >
                <span
                  className={styles.playerChipColor}
                  style={{ background: chipColor }}
                />
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt="" className={styles.playerChipAvatar} />
                ) : (
                  <div className={styles.playerChipAvatarFallback}>
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className={styles.playerChipName}>
                  {player.name}
                </span>
                {isPlayerShooter && <span className={styles.playerChipShooter}>DICE</span>}
                <span className={styles.playerChipBalance}>${player.balance.toLocaleString()}</span>
                {player.betsConfirmed && <span className={styles.playerChipLocked}>&#10003;</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payouts Popover */}
      {showPayouts && (
        <div className={styles.payoutOverlay} onClick={() => setShowPayouts(false)}>
          <div className={styles.payoutPopover} onClick={(e) => e.stopPropagation()}>
            <PayoutCard />
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className={styles.mainArea}>
        <div className={styles.tableSection}>
          <RollHistory rolls={visibleRollHistory} />
          <CrapsTable
            point={visiblePoint}
            bets={visibleBets}
            players={room.players}
            myPlayerId={myPlayerId}
            onPlaceBet={handlePlaceBet}
            onRemoveBet={handleRemoveBet}
            phase={room.phase}
            betsConfirmed={me?.betsConfirmed ?? false}
            selectedChip={selectedChip}
          />

          {/* Betting controls */}
          <div className={styles.bettingArea}>
            <BettingControls
              balance={me?.balance ?? 0}
              onPlaceBet={handlePlaceBet}
              onRemoveBet={handleRemoveBet}
              onConfirm={handleConfirmBets}
              myBets={myBets}
              point={room.point}
              selectedChip={selectedChip}
              onChipChange={setSelectedChip}
              confirmed={room.phase !== 'betting' || (me?.betsConfirmed ?? false) || diceRolling || diceAnimating}
            />
            <PhaseAnnouncement phase={room.phase} point={room.point} lastRollTotal={lastRollTotal} suppress={!!lastRoll && lastRoll.resolutions.length > 0} />
          </div>

          {/* Dice + Roll Button */}
          <div className={styles.diceActionRow}>
            <Dice lastRoll={lastRoll?.roll ?? null} point={room.point} onRollingChange={handleDiceRollingChange} />

            {room.phase === 'rolling' && isShooter && (
              <div className={styles.actionSlot}>
                <button className={styles.rollBtn} onClick={handleRollDice}>
                  Roll
                </button>
              </div>
            )}

            {room.phase === 'rolling' && !isShooter && (
              <div className={styles.actionSlot}>
                <p className={styles.waitingText}>
                  Waiting for {shooter?.name ?? 'shooter'}
                  <span className={styles.waitingDots}>
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </p>
              </div>
            )}
          </div>
          {rollCountdown !== null && rollCountdown > 0 && (room.phase === 'betting' || room.phase === 'rolling') && (
            <p className={styles.autoRollTimer}>{rollCountdown}s</p>
          )}
        </div>
      </div>

      {/* Floating Chat */}
      {createPortal(
        <div className={styles.floatingChat}>
          <Chat messages={chatMessages} onSend={handleChatSend} myPlayerId={myPlayerId} players={room.players} />
        </div>,
        document.body,
      )}

      {lastRoll && lastRoll.resolutions.length > 0 && (
        <BetResolutionOverlay
          resolutions={lastRoll.resolutions}
          players={room.players}
          myPlayerId={myPlayerId}
          onDismiss={onClearLastRoll}
        />
      )}
      <Confetti active={showConfetti} />
    </div>
  );
}
