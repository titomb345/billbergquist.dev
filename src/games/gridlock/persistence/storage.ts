import { STATS_VERSION, GridlockStatsSchema } from './schemas';
import type { GridlockStats } from '../types';

const STATS_KEY = 'gridlock-showdown-stats';

function computeChecksum(data: object): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

const DEFAULT_STATS: GridlockStats = {
  gamesPlayed: 0,
  bestScore: 0,
  bestLevel: 0,
  totalLines: 0,
  playerName: '',
};

export function saveStats(stats: GridlockStats): void {
  try {
    const serializable = {
      version: STATS_VERSION,
      ...stats,
    };
    const checksum = computeChecksum(serializable);
    localStorage.setItem(STATS_KEY, JSON.stringify({ ...serializable, checksum }));
  } catch {
    // Ignore storage errors
  }
}

export function loadStats(): GridlockStats {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (!saved) return DEFAULT_STATS;

    const parsed = JSON.parse(saved);
    const result = GridlockStatsSchema.safeParse(parsed);
    if (!result.success) return DEFAULT_STATS;

    const { version: _, checksum: __, ...stats } = result.data;
    return { ...DEFAULT_STATS, ...stats };
  } catch {
    return DEFAULT_STATS;
  }
}
