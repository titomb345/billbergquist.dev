import { useEffect, useMemo, useState } from 'react';
import type { BetResolution as BetResolutionType, BetType, Player } from '../types';
import { BET_LABELS, POST_RESULT_DELAY_MS } from '../constants';
import styles from './BetResolution.module.css';

interface AggregatedResolution {
  key: string;
  betType: BetType;
  totalWagered: number;
  totalPayout: number;
}

function aggregateResolutions(resolutions: BetResolutionType[]): AggregatedResolution[] {
  const map = new Map<string, AggregatedResolution>();
  for (const r of resolutions) {
    const existing = map.get(r.betType);
    if (existing) {
      existing.totalWagered += r.amount;
      existing.totalPayout += r.payout;
    } else {
      map.set(r.betType, { key: r.betType, betType: r.betType, totalWagered: r.amount, totalPayout: r.payout });
    }
  }
  return [...map.values()];
}

function aggregateByPlayer(resolutions: BetResolutionType[], players: Player[]) {
  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const map = new Map<string, { playerId: string; name: string; totalPayout: number; lines: AggregatedResolution[] }>();
  for (const r of resolutions) {
    const existing = map.get(r.playerId);
    if (!existing) {
      map.set(r.playerId, { playerId: r.playerId, name: playerMap.get(r.playerId) ?? '?', totalPayout: r.payout, lines: [{ key: r.betType, betType: r.betType, totalWagered: r.amount, totalPayout: r.payout }] });
    } else {
      existing.totalPayout += r.payout;
      const line = existing.lines.find((l) => l.betType === r.betType);
      if (line) {
        line.totalWagered += r.amount;
        line.totalPayout += r.payout;
      } else {
        existing.lines.push({ key: r.betType, betType: r.betType, totalWagered: r.amount, totalPayout: r.payout });
      }
    }
  }
  return [...map.values()];
}

function formatPayout(payout: number) {
  if (payout > 0) return `+$${payout}`;
  if (payout < 0) return `-$${Math.abs(payout)}`;
  return 'Push';
}

function payoutClass(payout: number) {
  if (payout > 0) return styles.winText;
  if (payout < 0) return styles.lossText;
  return styles.pushText;
}

interface BetResolutionOverlayProps {
  resolutions: BetResolutionType[];
  players: Player[];
  myPlayerId: string;
  onDismiss: () => void;
}

export function BetResolutionOverlay({ resolutions, players, myPlayerId, onDismiss }: BetResolutionOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), POST_RESULT_DELAY_MS);
    return () => clearTimeout(showTimer);
  }, []);

  const myResolutions = useMemo(() => resolutions.filter((r) => r.playerId === myPlayerId), [resolutions, myPlayerId]);
  const otherResolutions = useMemo(() => resolutions.filter((r) => r.playerId !== myPlayerId), [resolutions, myPlayerId]);

  const myGrouped = useMemo(() => aggregateResolutions(myResolutions), [myResolutions]);
  const myTotal = useMemo(() => myResolutions.reduce((sum, r) => sum + r.payout, 0), [myResolutions]);
  const othersGrouped = useMemo(() => aggregateByPlayer(otherResolutions, players), [otherResolutions, players]);

  const title = myGrouped.length > 0
    ? myTotal > 0 ? 'You Win!' : myTotal < 0 ? 'You Lose' : 'Push'
    : 'Results';

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        {myGrouped.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.title}>{title}</h3>
            <div className={`${styles.totalBanner} ${myTotal > 0 ? styles.win : myTotal < 0 ? styles.loss : styles.push}`}>
              {formatPayout(myTotal)}
            </div>
            {myGrouped.map((g) => (
              <div key={g.key} className={styles.resolution}>
                <span>{BET_LABELS[g.betType]} (${g.totalWagered})</span>
                <span className={payoutClass(g.totalPayout)}>
                  {formatPayout(g.totalPayout)}
                </span>
              </div>
            ))}
          </div>
        )}

        {othersGrouped.length > 0 && (
          <div className={styles.othersSection}>
            {othersGrouped.map((p) => (
              <div key={p.playerId} className={styles.otherResolution}>
                <span className={styles.otherName}>{p.name}</span>
                <span className={payoutClass(p.totalPayout)}>
                  {formatPayout(p.totalPayout)}
                </span>
              </div>
            ))}
          </div>
        )}

        <button className={styles.dismissBtn} onClick={onDismiss}>Continue</button>
      </div>
    </div>
  );
}
