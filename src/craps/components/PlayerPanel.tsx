import { useCallback, useMemo } from 'react';
import type { Bet, Player } from '../types';
import type { ActiveReaction } from './FloatingReaction';
import { FloatingReaction } from './FloatingReaction';
import { BET_LABELS } from '../constants';
import { aggregateBets } from '../engine';
import styles from './PlayerPanel.module.css';

interface PlayerPanelProps {
  player: Player;
  isShooter: boolean;
  isMe: boolean;
  bets: Bet[];
  reactions?: ActiveReaction[];
  onReactionComplete?: (id: string) => void;
}

export function PlayerPanel({ player, isShooter, isMe, bets, reactions = [], onReactionComplete }: PlayerPanelProps) {
  const handleReactionComplete = useCallback((id: string) => {
    onReactionComplete?.(id);
  }, [onReactionComplete]);

  const grouped = useMemo(() => aggregateBets(bets, null), [bets]);
  const totalBets = useMemo(() => bets.reduce((sum, b) => sum + b.amount, 0), [bets]);

  return (
    <div className={`${styles.panel} ${isMe ? styles.panelMe : ''} ${!player.connected ? styles.panelOffline : ''}`}>
      {reactions.map((r) => (
        <FloatingReaction key={r.id} reaction={r} onComplete={handleReactionComplete} />
      ))}
      <div className={styles.header}>
        <div className={styles.identity}>
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className={styles.nameCol}>
            <span className={styles.name}>
              {player.name}
              {isMe && <span className={styles.youTag}> (you)</span>}
            </span>
            {isShooter && <span className={styles.shooterBadge}>SHOOTER</span>}
          </div>
        </div>
        <div className={styles.balance}>${player.balance.toLocaleString()}</div>
      </div>

      {grouped.length > 0 && (
        <div className={styles.bets}>
          {grouped.map((g) => (
            <div key={g.key} className={styles.bet}>
              <span className={styles.betType}>{BET_LABELS[g.type]}</span>
              {g.point && <span className={styles.betPoint}>({g.point})</span>}
              <span className={styles.betAmount}>${g.total}</span>
            </div>
          ))}
          {grouped.length > 1 && (
            <div className={styles.betTotal}>
              Total: ${totalBets}
            </div>
          )}
        </div>
      )}

      {player.betsConfirmed && (
        <span className={styles.confirmedTag}>Bets Locked</span>
      )}
    </div>
  );
}
