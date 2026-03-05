// ── Game State ──

export type CrapsPhase = 'lobby' | 'betting' | 'rolling' | 'resolving';

export type BetType =
  | 'pass'
  | 'dontPass'
  | 'come'
  | 'dontCome'
  | 'field'
  | 'place4'
  | 'place5'
  | 'place6'
  | 'place8'
  | 'place9'
  | 'place10'
  | 'passOdds'
  | 'dontPassOdds'
  | 'comeOdds'
  | 'dontComeOdds'
  | 'hard4'
  | 'hard6'
  | 'hard8'
  | 'hard10'
  | 'anyCraps'
  | 'anySeven'
  | 'yo'
  | 'horn';

export interface Bet {
  id: string;
  playerId: string;
  type: BetType;
  amount: number;
  point?: number; // For come/don't come bets that have established a point
}

export interface DiceRoll {
  die1: number;
  die2: number;
  total: number;
}

export interface BetResolution {
  betId: string;
  playerId: string;
  betType: BetType;
  amount: number;
  payout: number; // positive = win, negative = loss
}

export interface Player {
  id: string;
  name: string;
  userId: string;
  isHost: boolean;
  connected: boolean;
  balance: number;
  ready: boolean;
  avatarUrl: string | null;
  betsConfirmed: boolean;
}

export interface CrapsGameState {
  roomCode: string;
  hostId: string;
  phase: CrapsPhase;
  players: Player[];
  shooterIndex: number;
  point: number | null; // null = come-out roll
  bets: Bet[];
  rollHistory: DiceRoll[];
  createdAt: number;
}

// ── Client → Server Messages ──

export type ReactionKey = 'dice' | 'fire' | 'skull' | 'clover' | 'angry' | 'clap';

export type CrapsClientMessage =
  | { type: 'create'; name: string; userId: string; avatarUrl?: string }
  | { type: 'join'; name: string; userId: string; avatarUrl?: string; roomCode: string }
  | { type: 'toggleReady' }
  | { type: 'startGame' }
  | { type: 'placeBet'; betType: BetType; amount: number; betPoint?: number }
  | { type: 'removeBet'; betId: string }
  | { type: 'confirmBets' }
  | { type: 'rollDice' }
  | { type: 'react'; reaction: ReactionKey }
  | { type: 'chat'; text: string }
  | { type: 'ping' };

// ── Server → Client Messages ──

export type CrapsServerMessage =
  | { type: 'sync'; state: CrapsGameState; playerId: string }
  | { type: 'playerUpdate'; players: Player[] }
  | { type: 'phaseChanged'; phase: CrapsPhase; point: number | null }
  | { type: 'betPlaced'; bet: Bet; players: Player[] }
  | { type: 'betRemoved'; betId: string; players: Player[] }
  | { type: 'diceRolled'; roll: DiceRoll; resolutions: BetResolution[]; players: Player[]; bets: Bet[]; point: number | null; phase: CrapsPhase; shooterIndex: number }
  | { type: 'reaction'; playerId: string; reaction: ReactionKey }
  | { type: 'chatMessage'; playerId: string; name: string; text: string; timestamp: number }
  | { type: 'error'; message: string }
  | { type: 'pong' };

// ── Shared Constants ──

export const STARTING_BALANCE = 1000;
export const MAX_PLAYERS = 4;

export const EMOJI_MAP: Record<ReactionKey, string> = {
  dice: '\u{1F3B2}',
  fire: '\u{1F525}',
  skull: '\u{1F480}',
  clover: '\u{1F340}',
  angry: '\u{1F624}',
  clap: '\u{1F44F}',
};
