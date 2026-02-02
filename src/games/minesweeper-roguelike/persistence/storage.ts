import {
  GAME_STATE_VERSION,
  STATS_VERSION,
  SerializedGameStateSchema,
  SerializedStatsSchema,
  isKnownPowerUpId,
} from './schemas';
import { applyMigrations, gameStateMigrations, statsMigrations } from './migrations';
import {
  RoguelikeGameState,
  RoguelikeStats,
  GamePhase,
  PowerUpId,
  CellState,
  Cell,
  PowerUp,
  RunState,
  FloorConfig,
} from '../types';
import { createRoguelikeInitialState, createInitialRunState } from '../logic/roguelikeLogic';
import { getPowerUpById } from '../constants';

const GAME_STATE_KEY = 'minesweeper-descent-save';
const STATS_KEY = 'minesweeper-roguelike-stats';

// Simple checksum using string hashing
function computeChecksum(data: object): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

function verifyChecksum(data: Record<string, unknown>, checksum: string): boolean {
  // Exclude only checksum - version IS part of the hash for tamper detection
  const { checksum: _, ...rest } = data;
  return computeChecksum(rest) === checksum;
}

// Map string cell state to enum
function toCellState(state: string): CellState {
  switch (state) {
    case 'hidden':
      return CellState.Hidden;
    case 'revealed':
      return CellState.Revealed;
    case 'flagged':
      return CellState.Flagged;
    default:
      return CellState.Hidden;
  }
}

// Map string phase to enum
function toGamePhase(phase: string): GamePhase {
  switch (phase) {
    case 'start':
      return GamePhase.Start;
    case 'playing':
      return GamePhase.Playing;
    case 'floor-clear':
      return GamePhase.FloorClear;
    case 'draft':
      return GamePhase.Draft;
    case 'exploding':
      return GamePhase.Exploding;
    case 'run-over':
      return GamePhase.RunOver;
    case 'victory':
      return GamePhase.Victory;
    default:
      return GamePhase.Start;
  }
}

// ============ GAME STATE ============

export function saveGameState(state: RoguelikeGameState): void {
  try {
    // Only save during active gameplay phases
    if (
      state.phase !== GamePhase.Playing &&
      state.phase !== GamePhase.Draft &&
      state.phase !== GamePhase.FloorClear
    ) {
      return;
    }

    // Include version in the data BEFORE computing checksum for tamper detection
    const serializable = {
      version: GAME_STATE_VERSION,
      phase: state.phase,
      board: state.board,
      floorConfig: state.floorConfig,
      minesRemaining: state.minesRemaining,
      time: state.time,
      isFirstClick: state.isFirstClick,
      isMobile: state.isMobile,
      run: state.run,
      draftOptions: state.draftOptions,
      dangerCells: Array.from(state.dangerCells),
      explodedCell: state.explodedCell,
      closeCallCell: state.closeCallCell,
      unlocks: state.unlocks,
    };

    const checksum = computeChecksum(serializable);

    const withMeta = {
      ...serializable,
      checksum,
    };

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(withMeta));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// TEMPORARY: Set to false to restore normal behavior
let SKIP_LOAD_FOR_TESTING = true;

export function loadGameState(currentUnlocks: PowerUpId[]): RoguelikeGameState | null {
  if (SKIP_LOAD_FOR_TESTING) return null;
  try {
    const saved = localStorage.getItem(GAME_STATE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    // Handle legacy saves without version (treat as version 0)
    const version = parsed.version ?? 0;

    // Apply migrations if needed
    const migrated =
      version < GAME_STATE_VERSION
        ? applyMigrations(parsed, version, GAME_STATE_VERSION, gameStateMigrations)
        : parsed;

    // Validate with Zod (use safeParse for graceful failure)
    const result = SerializedGameStateSchema.safeParse(migrated);
    if (!result.success) {
      console.warn('Game state validation failed:', result.error.issues);
      clearGameState();
      return null;
    }

    const validated = result.data;

    // Verify checksum
    if (!verifyChecksum(validated as Record<string, unknown>, validated.checksum)) {
      console.warn('Game state checksum mismatch - data may be corrupted');
      clearGameState();
      return null;
    }

    // Only restore active game phases
    if (
      validated.phase !== 'playing' &&
      validated.phase !== 'draft' &&
      validated.phase !== 'floor-clear'
    ) {
      return null;
    }

    // Validate board dimensions match floorConfig
    const boardRows = validated.board.length;
    const boardCols = validated.board[0]?.length ?? 0;
    if (boardRows !== validated.floorConfig.rows || boardCols !== validated.floorConfig.cols) {
      console.warn(
        `Board dimensions (${boardRows}x${boardCols}) don't match floorConfig (${validated.floorConfig.rows}x${validated.floorConfig.cols})`
      );
      clearGameState();
      return null;
    }

    // Create default state for merge
    const defaults = createRoguelikeInitialState(validated.isMobile, currentUnlocks);
    const defaultRun = createInitialRunState();

    // Convert board with proper enum types
    const board: Cell[][] = validated.board.map((row) =>
      row.map((cell) => ({
        row: cell.row,
        col: cell.col,
        isMine: cell.isMine,
        state: toCellState(cell.state),
        adjacentMines: cell.adjacentMines,
      }))
    );

    // Convert power-ups by looking up from constants (ensures descriptions are always current)
    const convertPowerUp = (p: (typeof validated.run.activePowerUps)[0]): PowerUp | null => {
      if (!isKnownPowerUpId(p.id)) {
        console.warn(`Filtering unknown power-up: ${p.id}`);
        return null;
      }
      // Always use the canonical powerup data from constants
      const canonical = getPowerUpById(p.id as PowerUpId);
      if (!canonical) {
        console.warn(`Power-up not found in pool: ${p.id}`);
        return null;
      }
      return canonical;
    };

    // Filter and convert active power-ups
    const activePowerUps = validated.run.activePowerUps
      .map(convertPowerUp)
      .filter((p): p is PowerUp => p !== null);

    // Convert run state
    const run: RunState = {
      ...defaultRun,
      currentFloor: validated.run.currentFloor,
      score: validated.run.score,
      activePowerUps,
      ironWillAvailable: validated.run.ironWillAvailable,
      xRayUsedThisFloor: validated.run.xRayUsedThisFloor,
      luckyStartUsedThisFloor: validated.run.luckyStartUsedThisFloor,
      seed: validated.run.seed,
      ascensionLevel: (validated.run.ascensionLevel ?? 0) as RunState['ascensionLevel'],
    };

    // Convert floor config
    const floorConfig: FloorConfig = {
      ...defaults.floorConfig,
      floor: validated.floorConfig.floor,
      rows: validated.floorConfig.rows,
      cols: validated.floorConfig.cols,
      mines: validated.floorConfig.mines,
    };

    // Convert draft options, filtering out unknown power-ups
    const draftOptions: PowerUp[] = validated.draftOptions
      .map(convertPowerUp)
      .filter((p): p is PowerUp => p !== null);

    // Merge unlocks: union of saved unlocks and current stats unlocks
    // This ensures consistency if stats were updated while game was saved
    const savedUnlocks = validated.unlocks.filter(isKnownPowerUpId) as PowerUpId[];
    const mergedUnlocks = [...new Set([...savedUnlocks, ...currentUnlocks])];

    // Merge with defaults (handles new fields gracefully)
    return {
      ...defaults,
      phase: toGamePhase(validated.phase),
      board,
      floorConfig,
      minesRemaining: validated.minesRemaining,
      time: validated.time,
      isFirstClick: validated.isFirstClick,
      isMobile: validated.isMobile,
      run,
      draftOptions,
      dangerCells: new Set(validated.dangerCells),
      explodedCell: validated.explodedCell,
      closeCallCell: validated.closeCallCell,
      unlocks: mergedUnlocks,
    };
  } catch (e) {
    console.warn('Failed to load game state:', e);
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch {
    // Ignore
  }
}

// ============ STATS ============

const DEFAULT_STATS: RoguelikeStats = {
  totalRuns: 0,
  bestFloor: 0,
  bestScore: 0,
  floorsCleared: 0,
  unlocks: [],
  highestAscensionUnlocked: 0,
  highestAscensionCleared: 0,
};

export function saveStats(stats: RoguelikeStats): void {
  try {
    // Include version in the data BEFORE computing checksum for tamper detection
    const serializable = {
      version: STATS_VERSION,
      totalRuns: stats.totalRuns,
      bestFloor: stats.bestFloor,
      bestScore: stats.bestScore,
      floorsCleared: stats.floorsCleared,
      unlocks: stats.unlocks,
      highestAscensionUnlocked: stats.highestAscensionUnlocked,
      highestAscensionCleared: stats.highestAscensionCleared,
    };

    const checksum = computeChecksum(serializable);

    const withMeta = {
      ...serializable,
      checksum,
    };

    localStorage.setItem(STATS_KEY, JSON.stringify(withMeta));
  } catch {
    // Ignore storage errors
  }
}

export function loadStats(): RoguelikeStats {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (!saved) return DEFAULT_STATS;

    const parsed = JSON.parse(saved);

    // Handle legacy saves without version
    const version = parsed.version ?? 0;

    // Apply migrations if needed
    const migrated =
      version < STATS_VERSION
        ? applyMigrations(parsed, version, STATS_VERSION, statsMigrations)
        : parsed;

    // Validate with Zod
    const result = SerializedStatsSchema.safeParse(migrated);
    if (!result.success) {
      console.warn('Stats validation failed:', result.error.issues);
      // Don't clear stats - salvage only known-safe numeric fields
      const salvaged: RoguelikeStats = { ...DEFAULT_STATS };
      if (typeof parsed.totalRuns === 'number' && parsed.totalRuns >= 0) {
        salvaged.totalRuns = Math.floor(parsed.totalRuns);
      }
      if (typeof parsed.bestFloor === 'number' && parsed.bestFloor >= 0 && parsed.bestFloor <= 10) {
        salvaged.bestFloor = Math.floor(parsed.bestFloor);
      }
      if (typeof parsed.bestScore === 'number' && parsed.bestScore >= 0) {
        salvaged.bestScore = Math.floor(parsed.bestScore);
      }
      if (typeof parsed.floorsCleared === 'number' && parsed.floorsCleared >= 0) {
        salvaged.floorsCleared = Math.floor(parsed.floorsCleared);
      }
      // Don't salvage unlocks - they need proper validation
      return salvaged;
    }

    const validated = result.data;

    // Verify checksum (but don't fail - stats are less critical)
    if (!verifyChecksum(validated as Record<string, unknown>, validated.checksum)) {
      console.warn('Stats checksum mismatch - using data anyway');
    }

    // Filter unlocks to only known power-up IDs (forward compatibility)
    const filteredUnlocks = validated.unlocks.filter(isKnownPowerUpId) as PowerUpId[];
    if (filteredUnlocks.length !== validated.unlocks.length) {
      console.warn(
        `Filtered ${validated.unlocks.length - filteredUnlocks.length} unknown power-up IDs from stats`
      );
    }

    // Merge with defaults
    return {
      ...DEFAULT_STATS,
      totalRuns: validated.totalRuns,
      bestFloor: validated.bestFloor,
      bestScore: validated.bestScore,
      floorsCleared: validated.floorsCleared,
      unlocks: filteredUnlocks,
      highestAscensionUnlocked: (validated.highestAscensionUnlocked ?? 0) as RoguelikeStats['highestAscensionUnlocked'],
      highestAscensionCleared: (validated.highestAscensionCleared ?? 0) as RoguelikeStats['highestAscensionCleared'],
    };
  } catch (e) {
    console.warn('Failed to load stats:', e);
    return DEFAULT_STATS;
  }
}

export function clearStats(): void {
  try {
    localStorage.removeItem(STATS_KEY);
  } catch {
    // Ignore
  }
}
