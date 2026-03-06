import { useMemo } from 'react';
import type { Bet, BetType } from '../types';
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
  selectedChip: number;
  onChipChange: (chip: number) => void;
  confirmed?: boolean;
}

export function BettingControls({ balance, onPlaceBet, onRemoveBet, onConfirm, myBets, point, selectedChip, onChipChange, confirmed = false }: BettingControlsProps) {
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

      {/* Active Bets + Confirm */}
      <div className={styles.footer}>
        <div className={styles.activeBets}>
          {grouped.map((group) => {
            const comeOddsAmt = group.type === 'come' && group.point
              ? snapBetAmount(selectedChip, 'comeOdds', point, group.point) : 0;
            const dontComeOddsAmt = group.type === 'dontCome' && group.point
              ? snapBetAmount(selectedChip, 'dontComeOdds', point, group.point) : 0;

            return (
            <div key={group.key} className={styles.activeBet}>
              <span className={styles.activeBetName}>
                {BET_LABELS[group.type]}
                {group.point ? ` (${group.point})` : ''}
              </span>
              <span className={styles.activeBetAmount}>${group.total}</span>
              {group.type === 'come' && group.point && (
                <button
                  className={styles.oddsBtn}
                  onClick={() => onPlaceBet('comeOdds', comeOddsAmt, group.point)}
                  disabled={confirmed || comeOddsAmt > balance}
                  title="Add Come Odds"
                >
                  +O
                </button>
              )}
              {group.type === 'dontCome' && group.point && (
                <button
                  className={styles.oddsBtn}
                  onClick={() => onPlaceBet('dontComeOdds', dontComeOddsAmt, group.point)}
                  disabled={confirmed || dontComeOddsAmt > balance}
                  title="Add DC Odds"
                >
                  +O
                </button>
              )}
              {group.removableIds.length > 0 ? (
                <button
                  className={styles.removeBtn}
                  onClick={() => group.removableIds.forEach((id) => onRemoveBet(id))}
                  title="Remove all bets"
                  aria-label="Remove all bets"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                <span className={styles.lockedTag}>locked</span>
              )}
            </div>
            );
          })}
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
