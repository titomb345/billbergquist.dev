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
import styles from './CrapsGame.module.css';

interface CrapsGameProps {
  room: CrapsGameState;
  myPlayerId: string;
  connectionStatus: string;
  lastRoll: { roll: DiceRoll; resolutions: BetResolution[] } | null;
  diceAnimating: boolean;
  onSend: (msg: CrapsClientMessage) => void;
  onClearLastRoll: () => void;
  onDiceAnimDone: () => void;
  chatMessages?: ChatMessage[];
}

export function CrapsGame({ room, myPlayerId, connectionStatus, lastRoll, diceAnimating, onSend, onClearLastRoll, onDiceAnimDone, chatMessages = [] }: CrapsGameProps) {
  const me = room.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost ?? false;
  const isShooter = room.players[room.shooterIndex]?.id === myPlayerId;
  const shooter = room.players[room.shooterIndex];
  const { playDiceRoll, playWin, playBigWin, playLoss, playChipPlace } = useSoundEffects();

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

  const [copyFeedback, setCopyFeedback] = useState(false);
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/craps/${room.roomCode}`);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }, [room.roomCode]);

  const [showPayouts, setShowPayouts] = useState(false);


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
          {room.players.map((player) => {
            const idx = room.players.indexOf(player);
            const isPlayerShooter = idx >= 0 && idx === room.shooterIndex;
            const isMe = player.id === myPlayerId;
            const colors = getPlayerColors();
            const chipColor = colors[idx % colors.length];
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
            point={room.point}
            bets={room.bets}
            players={room.players}
            myPlayerId={myPlayerId}
            onPlaceBet={handlePlaceBet}
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
              gameState={room}
              myPlayerId={myPlayerId}
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
