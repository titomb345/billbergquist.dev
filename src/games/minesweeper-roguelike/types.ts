export enum CellState {
  Hidden = 'hidden',
  Revealed = 'revealed',
  Flagged = 'flagged',
}

export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
}

export type Difficulty = 'beginner' | 'intermediate' | 'expert';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

// Mobile-optimized configs: swap rows/cols for expert to make it taller/narrower
export const MOBILE_DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 30, cols: 16, mines: 99 }, // Swapped: 16×30 → 30×16
};

export function getDifficultyConfig(difficulty: Difficulty, isMobile: boolean): DifficultyConfig {
  return isMobile ? MOBILE_DIFFICULTY_CONFIGS[difficulty] : DIFFICULTY_CONFIGS[difficulty];
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GameState {
  board: Cell[][];
  difficulty: Difficulty;
  status: GameStatus;
  minesRemaining: number;
  time: number;
  isFirstClick: boolean;
  isMobile: boolean;
}

export type GameAction =
  | { type: 'REVEAL_CELL'; row: number; col: number }
  | { type: 'TOGGLE_FLAG'; row: number; col: number }
  | { type: 'CHORD_CLICK'; row: number; col: number }
  | { type: 'NEW_GAME'; difficulty?: Difficulty; isMobile?: boolean }
  | { type: 'TICK' };

// ==================== ROGUELIKE TYPES ====================

// Power-up rarity tiers
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

// Power-up identifiers
export type PowerUpId =
  // Common
  | 'edge-walker'
  | 'danger-sense'
  | 'cautious-start'
  | 'heat-map'
  | 'quick-recovery'
  | 'breathing-room'
  | 'floor-scout'
  // Uncommon
  | 'pattern-memory'
  | 'survey'
  | 'momentum'
  | 'lucky-start'
  // Rare
  | 'sixth-sense'
  | 'mine-detector'
  | 'peek'
  | 'safe-path'
  | 'defusal-kit'
  | 'iron-will'
  | 'x-ray-vision'
  // Epic
  | 'probability-lens'
  | 'oracles-gift';

export interface PowerUp {
  id: PowerUpId;
  name: string;
  description: string;
  icon: string;
  type: 'passive' | 'active';
  rarity: Rarity;
  usesPerFloor?: number; // For active abilities
  activeHint?: string; // Hint shown when active powerup mode is enabled (single source of truth)
}

// Floor configuration (replaces Difficulty for roguelike mode)
export interface FloorConfig {
  floor: number;
  rows: number;
  cols: number;
  mines: number;
}

// Game phases for roguelike mode
export enum GamePhase {
  Start = 'start',
  Playing = 'playing',
  FloorClear = 'floor-clear',
  Draft = 'draft',
  Exploding = 'exploding',
  IronWillSave = 'iron-will-save',
  RunOver = 'run-over',
  Victory = 'victory',
}

// Ascension level type (re-exported from ascension.ts for convenience)
export type { AscensionLevel } from './ascension';

// Run state tracks current roguelike run
export interface RunState {
  currentFloor: number;
  score: number;
  activePowerUps: PowerUp[];
  ironWillUsedThisFloor: boolean; // Per-floor shield (true = already used this floor)
  traumaStacks: number; // Cumulative trauma from Iron Will triggers (+5% mine density each)
  xRayUsedThisFloor: boolean;
  luckyStartUsedThisFloor: boolean;
  quickRecoveryUsedThisRun: boolean; // Quick Recovery: one restart per run
  momentumActive: boolean; // Momentum: next click guaranteed safe after big cascade
  peekUsedThisFloor: boolean; // Peek: preview one cell per floor
  safePathUsedThisFloor: boolean; // Safe Path: reveal row/col per floor
  defusalKitUsedThisFloor: boolean; // Defusal Kit: remove one mine per floor
  surveyUsedThisFloor: boolean; // Survey: reveal mine count in row/col per floor
  probabilityLensUsedThisFloor: boolean; // Probability Lens: highlight safest cells per floor
  mineDetectorScansRemaining: number; // Mine Detector: scans left this floor (starts at 3)
  sixthSenseChargesRemaining: number; // Sixth Sense: charges left this floor (starts at 1)
  sixthSenseArmed: boolean; // Sixth Sense: currently armed for next click
  seed: string; // Run seed for sharing/comparing runs
  ascensionLevel: import('./ascension').AscensionLevel; // Current ascension level for this run
}

// Meta-progression stats persisted to localStorage
export interface RoguelikeStats {
  totalRuns: number;
  bestFloor: number;
  bestScore: number;
  floorsCleared: number;
  highestAscensionUnlocked: import('./ascension').AscensionLevel; // 0-5, unlocks on victory
  highestAscensionCleared: import('./ascension').AscensionLevel; // 0-5, highest won
}

// Full roguelike game state
export interface RoguelikeGameState {
  phase: GamePhase;
  board: Cell[][];
  floorConfig: FloorConfig;
  minesRemaining: number;
  time: number;
  isFirstClick: boolean;
  isMobile: boolean;
  run: RunState;
  draftOptions: PowerUp[];
  dangerCells: Set<string>; // Cell keys "row,col" that have danger glow
  chordHighlightCells: Set<string>; // Cell keys "row,col" to highlight during chord press
  patternMemoryCells: Set<string>; // Cell keys "row,col" for Pattern Memory safe diagonal glow
  explodedCell: { row: number; col: number } | null; // Cell that triggered explosion
  closeCallCell: { row: number; col: number } | null; // Cell where Iron Will saved player
  zeroCellCount: number | null; // Floor Scout: count of cells with 0 adjacent mines
  peekCell: { row: number; col: number; value: number | 'mine' } | null; // Peek preview
  heatMapEnabled: boolean; // Heat Map: tint revealed numbers by danger
  cellsRevealedThisFloor: number; // For Quick Recovery check
  surveyResult: { direction: 'row' | 'col'; index: number; mineCount: number } | null; // Survey result
  cellRevealTimes: Map<string, number>; // A4: "row,col" -> timestamp when revealed (for amnesia)
  fadedCells: Set<string>; // A4: "row,col" cells that have faded (numbers hidden)
  probabilityLensCells: Set<string>; // Probability Lens: highlighted safest cells
  oracleGiftCells: Set<string>; // Oracle's Gift: cells in 50/50 situations that are safe
  mineDetectorScannedCells: Set<string>; // Cell keys "row,col" scanned this floor (no-repeat)
  mineDetectorResult: { row: number; col: number; count: number } | null; // Last scan result
  sixthSenseTriggered: boolean; // Sixth Sense: redirect just occurred (for toast message)
}

// Roguelike-specific actions
export type RoguelikeAction =
  | { type: 'START_RUN'; isMobile: boolean; ascensionLevel: import('./ascension').AscensionLevel }
  | { type: 'GO_TO_START' }
  | { type: 'REVEAL_CELL'; row: number; col: number }
  | { type: 'TOGGLE_FLAG'; row: number; col: number }
  | { type: 'CHORD_CLICK'; row: number; col: number }
  | { type: 'USE_X_RAY'; row: number; col: number }
  | { type: 'USE_PEEK'; row: number; col: number }
  | { type: 'CLEAR_PEEK' }
  | { type: 'USE_SAFE_PATH'; direction: 'row' | 'col'; index: number }
  | { type: 'USE_DEFUSAL_KIT'; row: number; col: number }
  | { type: 'USE_SURVEY'; direction: 'row' | 'col'; index: number }
  | { type: 'USE_QUICK_RECOVERY' }
  | { type: 'SELECT_POWER_UP'; powerUp: PowerUp }
  | { type: 'SKIP_DRAFT'; bonusPoints: number }
  | { type: 'TICK' }
  | { type: 'SET_MOBILE'; isMobile: boolean }
  | { type: 'EXPLOSION_COMPLETE' }
  | { type: 'FLOOR_CLEAR_COMPLETE' }
  | { type: 'IRON_WILL_COMPLETE' }
  | { type: 'SET_CHORD_HIGHLIGHT'; row: number; col: number }
  | { type: 'CLEAR_CHORD_HIGHLIGHT' }
  | { type: 'UPDATE_FADED_CELLS' } // A4: Check and update faded cells
  | { type: 'USE_PROBABILITY_LENS' }
  | { type: 'CLEAR_PROBABILITY_LENS' }
  | { type: 'USE_MINE_DETECTOR'; row: number; col: number }
  | { type: 'CLEAR_MINE_DETECTOR_RESULT' }
  | { type: 'TOGGLE_SIXTH_SENSE_ARM' }
  | { type: 'CLEAR_SIXTH_SENSE_TRIGGERED' };
