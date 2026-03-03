import type { Column, RoomSettings } from './types';

// Update this after deploying the Cloudflare Worker
export const WORKER_URL = 'https://retro-worker.billbergquist.workers.dev';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-1', label: 'Good', color: 'mint' },
  { id: 'col-2', label: 'Bad', color: 'magenta' },
  { id: 'col-3', label: 'Start', color: 'orange' },
  { id: 'col-4', label: 'Stop', color: 'purple' },
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
  summary: 'Summary',
};

export const PHASE_ORDER = ['lobby', 'write', 'group', 'vote', 'discuss', 'actions', 'summary'] as const;

// Phases shown in the stepper UI (excludes terminal summary phase)
export const WORKFLOW_PHASES = ['lobby', 'write', 'group', 'vote', 'discuss', 'actions'] as const;

export const COLUMN_CSS_MAP: Record<string, string> = {
  mint: 'var(--neon-mint)',
  magenta: 'var(--neon-magenta)',
  orange: 'var(--neon-orange)',
  purple: 'var(--neon-purple)',
  yellow: 'var(--neon-yellow)',
};

export interface ColumnTemplate {
  name: string;
  columns: Column[];
}

export const COLUMN_TEMPLATES: ColumnTemplate[] = [
  {
    name: 'Good / Bad / Start / Stop',
    columns: [
      { id: 'col-1', label: 'Good', color: 'mint' },
      { id: 'col-2', label: 'Bad', color: 'magenta' },
      { id: 'col-3', label: 'Start', color: 'orange' },
      { id: 'col-4', label: 'Stop', color: 'purple' },
    ],
  },
  {
    name: 'Went Well / Didn\'t / Improvements',
    columns: [
      { id: 'col-1', label: 'What went well', color: 'mint' },
      { id: 'col-2', label: "What didn't go well", color: 'magenta' },
      { id: 'col-3', label: 'Improvements', color: 'orange' },
    ],
  },
  {
    name: 'Liked / Learned / Lacked / Longed For',
    columns: [
      { id: 'col-1', label: 'Liked', color: 'mint' },
      { id: 'col-2', label: 'Learned', color: 'purple' },
      { id: 'col-3', label: 'Lacked', color: 'magenta' },
      { id: 'col-4', label: 'Longed for', color: 'yellow' },
    ],
  },
  {
    name: 'Mad / Sad / Glad',
    columns: [
      { id: 'col-1', label: 'Mad', color: 'magenta' },
      { id: 'col-2', label: 'Sad', color: 'purple' },
      { id: 'col-3', label: 'Glad', color: 'mint' },
    ],
  },
  {
    name: 'Custom',
    columns: [],
  },
];
