import type { PieceType, RotationState } from './types';

/** Board dimensions */
export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
/** Extra hidden rows above the visible area for piece spawning */
export const BUFFER_ROWS = 4;
export const TOTAL_ROWS = BOARD_ROWS + BUFFER_ROWS;

/** Spawn position (centered, top of visible area) */
export const SPAWN_COL = 3;
export const SPAWN_ROW = BUFFER_ROWS - 2; // 2 rows into the buffer

/**
 * Tetromino shapes defined as occupied cells relative to a bounding box.
 * Each rotation state is an array of [row, col] offsets.
 * Uses SRS standard orientations.
 */
export const PIECE_SHAPES: Record<PieceType, [number, number][][]> = {
  I: [
    // 0: spawn
    [[1, 0], [1, 1], [1, 2], [1, 3]],
    // 1: CW
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    // 2: 180
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    // 3: CCW
    [[0, 1], [1, 1], [2, 1], [3, 1]],
  ],
  O: [
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
  ],
  T: [
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
  S: [
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 1], [1, 2], [2, 0], [2, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ],
  Z: [
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 2], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
  ],
  J: [
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
  ],
  L: [
    [[0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [1, 2], [2, 0]],
    [[0, 0], [0, 1], [1, 1], [2, 1]],
  ],
};

/**
 * SRS wall kick data.
 * Maps (fromRotation, toRotation) to an array of [row, col] offsets to try.
 * The first offset (0,0) is implicit and not listed.
 */
type KickKey = `${RotationState}-${RotationState}`;

const JLSTZ_KICKS: Record<KickKey, [number, number][]> = {
  '0-1': [[0, -1], [-1, -1], [2, 0], [2, -1]],
  '1-0': [[0, 1], [1, 1], [-2, 0], [-2, 1]],
  '1-2': [[0, 1], [1, 1], [-2, 0], [-2, 1]],
  '2-1': [[0, -1], [-1, -1], [2, 0], [2, -1]],
  '2-3': [[0, 1], [-1, 1], [2, 0], [2, 1]],
  '3-2': [[0, -1], [1, -1], [-2, 0], [-2, -1]],
  '3-0': [[0, -1], [1, -1], [-2, 0], [-2, -1]],
  '0-3': [[0, 1], [-1, 1], [2, 0], [2, 1]],
};

const I_KICKS: Record<KickKey, [number, number][]> = {
  '0-1': [[0, -2], [0, 1], [1, -2], [-2, 1]],
  '1-0': [[0, 2], [0, -1], [-1, 2], [2, -1]],
  '1-2': [[0, -1], [0, 2], [-2, -1], [1, 2]],
  '2-1': [[0, 1], [0, -2], [2, 1], [-1, -2]],
  '2-3': [[0, 2], [0, -1], [-1, 2], [2, -1]],
  '3-2': [[0, -2], [0, 1], [1, -2], [-2, 1]],
  '3-0': [[0, 1], [0, -2], [2, 1], [-1, -2]],
  '0-3': [[0, -1], [0, 2], [-2, -1], [1, 2]],
};

export function getWallKicks(
  piece: PieceType,
  from: RotationState,
  to: RotationState,
): [number, number][] {
  const key: KickKey = `${from}-${to}`;
  if (piece === 'I') return I_KICKS[key] ?? [];
  if (piece === 'O') return [];
  return JLSTZ_KICKS[key] ?? [];
}

/** Neon colors for each piece type */
export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00d4aa', // mint
  O: '#f59e0b', // yellow
  T: '#bf00ff', // purple
  S: '#22c55e', // green
  Z: '#ff0066', // red/magenta
  J: '#3b82f6', // blue
  L: '#ff6a00', // orange
};

/** Glow colors (lower opacity) for each piece type */
export const PIECE_GLOW_COLORS: Record<PieceType, string> = {
  I: 'rgba(0, 212, 170, 0.4)',
  O: 'rgba(245, 158, 11, 0.4)',
  T: 'rgba(191, 0, 255, 0.4)',
  S: 'rgba(34, 197, 94, 0.4)',
  Z: 'rgba(255, 0, 102, 0.4)',
  J: 'rgba(59, 130, 246, 0.4)',
  L: 'rgba(255, 106, 0, 0.4)',
};

/** Scoring values per line clear type */
export const LINE_CLEAR_SCORES: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

/** Points per cell for soft drop */
export const SOFT_DROP_SCORE = 1;

/** Points per cell for hard drop */
export const HARD_DROP_SCORE = 2;

/** Lines needed to level up */
export const LINES_PER_LEVEL = 10;

/**
 * Gravity speed in milliseconds per drop.
 * Index = level (0-indexed internally, but level 1 maps to index 0).
 * Speed curve loosely based on NES Tetris.
 */
export const GRAVITY_SPEEDS: number[] = [
  800,  // Level 1
  717,  // Level 2
  633,  // Level 3
  550,  // Level 4
  467,  // Level 5
  383,  // Level 6
  300,  // Level 7
  217,  // Level 8
  133,  // Level 9
  100,  // Level 10
  83,   // Level 11
  67,   // Level 12
  50,   // Level 13
  33,   // Level 14
  17,   // Level 15+
];

export function getGravitySpeed(level: number): number {
  const idx = Math.min(level - 1, GRAVITY_SPEEDS.length - 1);
  return GRAVITY_SPEEDS[Math.max(0, idx)];
}

/** Lock delay in milliseconds */
export const LOCK_DELAY = 500;

/** Maximum lock resets before force-locking */
export const MAX_LOCK_RESETS = 15;

/** Line clear animation duration in milliseconds */
export const LINE_CLEAR_DURATION = 300;

/** All 7 piece types for bag generation */
export const ALL_PIECES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** DAS (Delayed Auto-Shift) in ms */
export const DAS_DELAY = 167;

/** ARR (Auto-Repeat Rate) in ms */
export const ARR_DELAY = 33;
