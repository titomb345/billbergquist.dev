// ── Room State ──

export type RetroPhase = 'lobby' | 'write' | 'group' | 'vote' | 'discuss' | 'actions' | 'summary';

export type ColumnColor = 'mint' | 'magenta' | 'orange' | 'purple' | 'yellow';

export interface Column {
  id: string;
  label: string;
  color: ColumnColor;
}

export interface Card {
  id: string;
  columnId: string;
  text: string;
  authorId: string;
  authorName: string | null;
  votes: number;
  createdAt: number;
  groupId: string | null;
}

export interface CardGroup {
  id: string;
  cardIds: string[];
  label: string | null;
}

export interface Vote {
  participantId: string;
  cardId: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee: string;
}

export interface Participant {
  id: string;
  name: string;
  userId: string;
  isHost: boolean;
  connected: boolean;
  votesRemaining: number;
  ready: boolean;
  avatarUrl: string | null;
}

export interface RoomSettings {
  votesPerPerson: number;
  timerDuration: number;
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  phase: RetroPhase;
  columns: Column[];
  cards: Card[];
  votes: Vote[];
  actionItems: ActionItem[];
  participants: Participant[];
  settings: RoomSettings;
  timerEnd: number | null;
  privacyMode: boolean;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  groups: CardGroup[];
  focusedItemId: string | null;
}

// ── Client → Server Messages ──

export type ClientMessage =
  | { type: 'create'; name: string; userId: string; avatarUrl?: string; settings?: Partial<RoomSettings>; columns?: Column[] }
  | { type: 'join'; name: string; userId: string; avatarUrl?: string; roomCode: string }
  | { type: 'addCard'; columnId: string; text: string }
  | { type: 'deleteCard'; cardId: string }
  | { type: 'editCard'; cardId: string; text: string }
  | { type: 'vote'; cardId: string }
  | { type: 'unvote'; cardId: string }
  | { type: 'movePhase'; phase: RetroPhase }
  | { type: 'startTimer'; duration?: number }
  | { type: 'stopTimer' }
  | { type: 'addAction'; text: string; assignee: string }

  | { type: 'updateColumns'; columns: Column[] }
  | { type: 'revealAuthors' }
  | { type: 'togglePrivacy' }
  | { type: 'groupCards'; cardIds: string[] }
  | { type: 'ungroupCard'; cardId: string }
  | { type: 'dissolveGroup'; groupId: string }
  | { type: 'setGroupLabel'; groupId: string; label: string }
  | { type: 'updateSettings'; settings: Partial<RoomSettings> }
  | { type: 'resetVotes' }
  | { type: 'toggleReady' }
  | { type: 'focusItem'; itemId: string | null }
  | { type: 'deleteAction'; actionId: string }
  | { type: 'editAction'; actionId: string; text: string }
  | { type: 'transferHost'; targetParticipantId: string }
  | { type: 'reorderActions'; actionIds: string[] }
  | { type: 'leave' }
  | { type: 'ping' };

// ── Server → Client Messages ──

export type ServerMessage =
  | { type: 'sync'; state: RoomState; participantId: string }
  | { type: 'cardAdded'; card: Card }
  | { type: 'cardDeleted'; cardId: string }
  | { type: 'cardEdited'; cardId: string; text: string }
  | { type: 'voteUpdated'; cardId: string; votes: number; participantId: string; action: 'vote' | 'unvote'; primary: boolean; votesRemaining: number }
  | { type: 'phaseChanged'; phase: RetroPhase; startedAt?: number; endedAt?: number }
  | { type: 'timerUpdate'; timerEnd: number | null }
  | { type: 'participantUpdate'; participants: Participant[] }
  | { type: 'actionAdded'; action: ActionItem }

  | { type: 'columnsUpdated'; columns: Column[] }
  | { type: 'authorsRevealed'; cards: Card[] }
  | { type: 'privacyChanged'; privacyMode: boolean }
  | { type: 'groupsUpdated'; groups: CardGroup[]; cards: Card[]; votes?: Vote[]; participants?: Participant[] }
  | { type: 'settingsUpdated'; settings: RoomSettings }
  | { type: 'focusUpdated'; focusedItemId: string | null }
  | { type: 'votesReset'; cards: Card[]; votes: Vote[]; participants: Participant[] }
  | { type: 'actionDeleted'; actionId: string }
  | { type: 'actionEdited'; actionId: string; text: string }
  | { type: 'hostTransferred'; newHostId: string; participants: Participant[] }
  | { type: 'actionsReordered'; actionItems: ActionItem[] }
  | { type: 'participantLeft'; participantId: string; participants: Participant[]; hostId: string }
  | { type: 'error'; message: string }
  | { type: 'pong' };
