import { z } from 'zod';
import { ALL_POWER_UP_IDS } from '../constants';

export const GAME_STATE_VERSION = 3;
export const STATS_VERSION = 3;

// Cell schema
export const CellStateSchema = z.enum(['hidden', 'revealed', 'flagged']);
export const CellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  isMine: z.boolean(),
  state: CellStateSchema,
  adjacentMines: z.number().int().min(0).max(8),
});

// PowerUp schemas
// Known power-up IDs - derived from POWER_UP_POOL in constants
export const KNOWN_POWER_UP_IDS = ALL_POWER_UP_IDS;

export const PowerUpIdSchema = z.enum(KNOWN_POWER_UP_IDS);

// Lenient version that accepts any string - for forward compatibility
// Unknown power-ups from future versions will be filtered at load time
export const LenientPowerUpIdSchema = z.string();

export const PowerUpTypeSchema = z.enum(['passive', 'active']);

// Lenient PowerUp schema - accepts unknown power-up IDs for forward compatibility
export const LenientPowerUpSchema = z.object({
  id: LenientPowerUpIdSchema,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  type: PowerUpTypeSchema,
  usesPerFloor: z.number().optional(),
});

// Strict PowerUp schema - for runtime validation
export const PowerUpSchema = z.object({
  id: PowerUpIdSchema,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  type: PowerUpTypeSchema,
  usesPerFloor: z.number().optional(),
});

// Helper to check if a string is a known power-up ID
export function isKnownPowerUpId(id: string): id is (typeof KNOWN_POWER_UP_IDS)[number] {
  return KNOWN_POWER_UP_IDS.includes(id as (typeof KNOWN_POWER_UP_IDS)[number]);
}

// FloorConfig schema
export const FloorConfigSchema = z.object({
  floor: z.number().int().min(1).max(10),
  rows: z.number().int().min(1),
  cols: z.number().int().min(1),
  mines: z.number().int().min(1),
});

// GamePhase schema
export const GamePhaseSchema = z.enum([
  'start',
  'playing',
  'floor-clear',
  'draft',
  'exploding',
  'iron-will-save',
  'run-over',
  'victory',
]);

// Ascension level schema (0-5)
export const AscensionLevelSchema = z.number().int().min(0).max(5);

// RunState schema - uses lenient power-up schema for forward compatibility
export const RunStateSchema = z.object({
  currentFloor: z.number().int().min(1).max(10),
  score: z.number().int().min(0),
  activePowerUps: z.array(LenientPowerUpSchema),
  ironWillAvailable: z.boolean(),
  xRayUsedThisFloor: z.boolean(),
  luckyStartUsedThisFloor: z.boolean(),
  quickRecoveryUsedThisRun: z.boolean().default(false),
  momentumActive: z.boolean().default(false),
  peekUsedThisFloor: z.boolean().default(false),
  safePathUsedThisFloor: z.boolean().default(false),
  defusalKitUsedThisFloor: z.boolean().default(false),
  surveyUsedThisFloor: z.boolean().default(false),
  probabilityLensUsedThisFloor: z.boolean().default(false),
  seed: z.string(),
  ascensionLevel: AscensionLevelSchema.default(0),
});

// Survey result schema
export const SurveyResultSchema = z
  .object({
    direction: z.enum(['row', 'col']),
    index: z.number().int().min(0),
    mineCount: z.number().int().min(0),
  })
  .nullable();

// Peek cell schema (value can be number 0-8 or 'mine')
export const PeekCellSchema = z
  .object({
    row: z.number().int().min(0),
    col: z.number().int().min(0),
    value: z.union([z.number().int().min(0).max(8), z.literal('mine')]),
  })
  .nullable();

// Serialized game state (dangerCells as array)
// Uses lenient schemas for forward compatibility with future power-ups
export const SerializedGameStateSchema = z.object({
  version: z.number().int().min(1),
  checksum: z.string(),
  phase: GamePhaseSchema,
  board: z.array(z.array(CellSchema)),
  floorConfig: FloorConfigSchema,
  minesRemaining: z.number().int(),
  time: z.number().int().min(0).max(999),
  isFirstClick: z.boolean(),
  isMobile: z.boolean(),
  run: RunStateSchema,
  draftOptions: z.array(LenientPowerUpSchema),
  dangerCells: z.array(z.string()), // Serialized Set
  explodedCell: z.object({ row: z.number(), col: z.number() }).nullable(),
  closeCallCell: z.object({ row: z.number(), col: z.number() }).nullable(),
  // Active relic visual state
  surveyResult: SurveyResultSchema.default(null),
  probabilityLensCells: z.array(z.string()).default([]), // Serialized Set
  peekCell: PeekCellSchema.default(null),
});

// Stats schema
export const SerializedStatsSchema = z.object({
  version: z.number().int().min(1),
  checksum: z.string(),
  totalRuns: z.number().int().min(0),
  bestFloor: z.number().int().min(0).max(10),
  bestScore: z.number().int().min(0),
  floorsCleared: z.number().int().min(0),
  highestAscensionUnlocked: AscensionLevelSchema.default(0),
  highestAscensionCleared: AscensionLevelSchema.default(0),
});
