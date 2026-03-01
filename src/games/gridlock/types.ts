/** Tetromino piece type identifier */
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Rotation state (0=spawn, 1=CW, 2=180, 3=CCW) */
export type RotationState = 0 | 1 | 2 | 3;

/** A position on the board */
export interface Position {
  row: number;
  col: number;
}

/** An active falling piece */
export interface ActivePiece {
  type: PieceType;
  /** Top-left anchor position on the board */
  position: Position;
  rotation: RotationState;
}

/** A single cell on the board (null = empty) */
export type CellValue = PieceType | null;

/** The 10x20 board grid (row 0 = top) */
export type Board = CellValue[][];

/** Game phase state machine */
export enum GamePhase {
  Start = 'start',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'game-over',
  LineClear = 'line-clear',
}

/** Full game state */
export interface GridlockState {
  phase: GamePhase;
  board: Board;
  activePiece: ActivePiece | null;
  ghostY: number;
  nextPiece: PieceType;
  heldPiece: PieceType | null;
  canHold: boolean;
  bag: PieceType[];
  score: number;
  level: number;
  lines: number;
  /** Milliseconds since game start */
  time: number;
  /** Timestamp of last gravity drop */
  lastDropTime: number;
  /** Lock delay timer (ms remaining, null if not grounded) */
  lockTimer: number | null;
  /** Number of lock resets used for current piece */
  lockResets: number;
  /** Lines being cleared (for animation) */
  clearingLines: number[];
  /** Whether the game just started (for countdown, etc.) */
  isMobile: boolean;
}

/** Local stats persisted in localStorage */
export interface GridlockStats {
  gamesPlayed: number;
  bestScore: number;
  bestLevel: number;
  totalLines: number;
  /** Remembered player name for leaderboard */
  playerName: string;
}

/** Leaderboard entry from Supabase */
export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  level: number;
  lines: number;
  created_at: string;
}

/** Actions for the game reducer */
export type GridlockAction =
  | { type: 'START_GAME'; isMobile: boolean }
  | { type: 'TICK'; timestamp: number }
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'SOFT_DROP' }
  | { type: 'HARD_DROP' }
  | { type: 'ROTATE_CW' }
  | { type: 'ROTATE_CCW' }
  | { type: 'HOLD' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'CLEAR_ANIMATION_DONE' }
  | { type: 'RESET' };
