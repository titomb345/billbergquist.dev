import { useMemo } from 'react';
import type { Bet, BetType, CrapsGameState } from '../types';
import { CHIP_DENOMINATIONS, BET_LABELS } from '../constants';
import { aggregateBets, snapBetAmount } from '../engine';
import styles from './BettingControls.module.css';

interface BettingControlsProps {
  balance: number;
  onPlaceBet: (betType: BetType, amount: number, betPoint?: number) => void;
  onRemoveBet: (betId: string) => void;
  onConfirm: () => void;
  myBets: Bet[];
  point: number | null;
  gameState: CrapsGameState;
  myPlayerId: string;
  selectedChip: number;
  onChipChange: (chip: number) => void;
  confirmed?: boolean;
}

interface BetCategory {
  label: string;
  bets: { type: BetType; label: string; available: boolean; betPoint?: number }[];
}

export function BettingControls({ balance, onPlaceBet, onRemoveBet, onConfirm, myBets, point, gameState: _gameState, myPlayerId: _myPlayerId, selectedChip, onChipChange, confirmed = false }: BettingControlsProps) {
  const isComingOut = point === null;

  const comePointBets = myBets.filter((b) => b.type === 'come' && b.point);
  const dontComePointBets = myBets.filter((b) => b.type === 'dontCome' && b.point);

  const categories = useMemo((): BetCategory[] => {
    const cats: BetCategory[] = [
      {
        label: 'Line Bets',
        bets: [
          { type: 'pass', label: BET_LABELS.pass, available: isComingOut },
          { type: 'dontPass', label: BET_LABELS.dontPass, available: isComingOut },
          { type: 'come', label: BET_LABELS.come, available: !isComingOut },
          { type: 'dontCome', label: BET_LABELS.dontCome, available: !isComingOut },
        ],
      },
      {
        label: 'Place Bets',
        bets: [
          { type: 'place4', label: '4', available: true },
          { type: 'place5', label: '5', available: true },
          { type: 'place6', label: '6', available: true },
          { type: 'place8', label: '8', available: true },
          { type: 'place9', label: '9', available: true },
          { type: 'place10', label: '10', available: true },
        ],
      },
      {
        label: 'Odds',
        bets: [
          { type: 'passOdds', label: BET_LABELS.passOdds, available: !isComingOut && myBets.some((b) => b.type === 'pass') },
          { type: 'dontPassOdds', label: BET_LABELS.dontPassOdds, available: !isComingOut && myBets.some((b) => b.type === 'dontPass') },
          ...comePointBets.map((b) => ({
            type: 'comeOdds' as BetType,
            label: `Come (${b.point})`,
            available: true,
            betPoint: b.point,
          })),
          ...dontComePointBets.map((b) => ({
            type: 'dontComeOdds' as BetType,
            label: `DC (${b.point})`,
            available: true,
            betPoint: b.point,
          })),
        ],
      },
      {
        label: 'Hardways',
        bets: [
          { type: 'hard4', label: '4', available: true },
          { type: 'hard6', label: '6', available: true },
          { type: 'hard8', label: '8', available: true },
          { type: 'hard10', label: '10', available: true },
        ],
      },
      {
        label: 'Props',
        bets: [
          { type: 'field', label: BET_LABELS.field, available: true },
          { type: 'anyCraps', label: 'Craps', available: true },
          { type: 'anySeven', label: 'Any 7', available: true },
          { type: 'yo', label: 'Yo 11', available: true },
          { type: 'horn', label: BET_LABELS.horn, available: true },
        ],
      },
    ];
    // Filter out odds category if no odds bets are available
    return cats.filter((c) => c.bets.length > 0);
  }, [isComingOut, myBets, comePointBets, dontComePointBets]);

  const grouped = useMemo(
    () => aggregateBets(myBets, point, true),
    [myBets, point],
  );

  const totalBetAmount = grouped.reduce((sum, g) => sum + g.total, 0);

  return (
    <div className={styles.controls}>
      {confirmed && (
        <div className={styles.confirmedOverlay}>
          <span className={styles.confirmedLabel}>BETS LOCKED</span>
        </div>
      )}

      {/* Chip Selector */}
      <div className={styles.chipBar}>
        <span className={styles.chipBarLabel}>Select Chip</span>
        <div className={styles.chips}>
          {CHIP_DENOMINATIONS.map((chip) => (
            <button
              key={chip}
              className={`${styles.chipBtn} ${selectedChip === chip ? styles.chipActive : ''}`}
              onClick={() => onChipChange(chip)}
              disabled={confirmed || chip > balance}
              aria-label={`$${chip} chip`}
            >
              <span className={styles.chipValue}>${chip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bet Categories */}
      <div className={styles.betCategories}>
        {categories.map((cat) => (
          <div key={cat.label} className={styles.category}>
            <span className={styles.categoryLabel}>{cat.label}</span>
            <div className={styles.categoryBets}>
              {cat.bets.map(({ type, label, available, betPoint: bp }) => {
                const amount = snapBetAmount(selectedChip, type, point, bp);
                const key = bp != null ? `${type}:${bp}` : type;
                const hasBet = myBets.some((b) => b.type === type && (bp == null || b.point === bp));
                return (
                  <button
                    key={key}
                    className={`${styles.betBtn} ${!available ? styles.betUnavailable : ''} ${hasBet ? styles.betHasBet : ''}`}
                    onClick={() => onPlaceBet(type, amount, bp)}
                    disabled={confirmed || !available || amount > balance}
                  >
                    <span className={styles.betLabel}>{label}</span>
                    {hasBet && <span className={styles.betDot} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Active Bets + Confirm */}
      <div className={styles.footer}>
        <div className={styles.activeBets}>
          {grouped.map((group) => (
            <div key={group.key} className={styles.activeBet}>
              <span className={styles.activeBetName}>
                {BET_LABELS[group.type]}
                {group.point ? ` (${group.point})` : ''}
              </span>
              <span className={styles.activeBetAmount}>${group.total}</span>
              {group.removableId ? (
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemoveBet(group.removableId!)}
                  title="Remove last bet"
                  aria-label="Remove bet"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                <span className={styles.lockedTag}>locked</span>
              )}
            </div>
          ))}
        </div>

        <div className={styles.confirmCol}>
          {totalBetAmount > 0 && (
            <span className={styles.totalBet}>Total: ${totalBetAmount}</span>
          )}
          <button
            className={`${styles.confirmBtn} ${confirmed ? styles.confirmLocked : ''}`}
            onClick={onConfirm}
            disabled={confirmed}
          >
            {confirmed ? 'Waiting...' : 'Confirm Bets'}
          </button>
        </div>
      </div>
    </div>
  );
}
