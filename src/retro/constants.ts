import type { Column, RoomSettings } from './types';

// Update this after deploying the Cloudflare Worker
export const WORKER_URL = 'https://retro-worker.billbergquist.workers.dev';

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-1', label: 'What went well', color: 'mint' },
  { id: 'col-2', label: "What didn't go well", color: 'magenta' },
  { id: 'col-3', label: 'Improvements', color: 'orange' },
];

export const DEFAULT_SETTINGS: RoomSettings = {
  votesPerPerson: 5,
  timerDuration: 300,
};

export const PHASE_LABELS: Record<string, string> = {
  lobby: 'Lobby',
  write: 'Write',
  group: 'Group',
  vote: 'Vote',
  discuss: 'Discuss',
  actions: 'Actions',
};

export const PHASE_ORDER = ['lobby', 'write', 'group', 'vote', 'discuss', 'actions'] as const;

export const COLUMN_CSS_MAP: Record<string, string> = {
  mint: 'var(--neon-mint)',
  magenta: 'var(--neon-magenta)',
  orange: 'var(--neon-orange)',
};
