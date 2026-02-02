import { FloorConfig, PowerUp, PowerUpId, Rarity } from './types';
import { AscensionLevel, getAscensionModifiers } from './ascension';

// Floor configurations - escalate from floor 1 (6x6, 4 mines) to floor 10 (12x12, 40 mines)
export const FLOOR_CONFIGS: FloorConfig[] = [
  { floor: 1, rows: 6, cols: 6, mines: 4 },
  { floor: 2, rows: 7, cols: 7, mines: 6 },
  { floor: 3, rows: 8, cols: 8, mines: 10 },
  { floor: 4, rows: 8, cols: 8, mines: 12 },
  { floor: 5, rows: 9, cols: 9, mines: 15 },
  { floor: 6, rows: 9, cols: 9, mines: 18 },
  { floor: 7, rows: 10, cols: 10, mines: 22 },
  { floor: 8, rows: 10, cols: 10, mines: 28 },
  { floor: 9, rows: 11, cols: 11, mines: 34 },
  { floor: 10, rows: 12, cols: 12, mines: 40 },
];

// Mobile floor configs - keep boards more square/portrait-oriented
export const MOBILE_FLOOR_CONFIGS: FloorConfig[] = [
  { floor: 1, rows: 6, cols: 6, mines: 4 },
  { floor: 2, rows: 7, cols: 7, mines: 6 },
  { floor: 3, rows: 8, cols: 8, mines: 10 },
  { floor: 4, rows: 9, cols: 8, mines: 12 },
  { floor: 5, rows: 10, cols: 8, mines: 15 },
  { floor: 6, rows: 10, cols: 9, mines: 18 },
  { floor: 7, rows: 11, cols: 9, mines: 22 },
  { floor: 8, rows: 12, cols: 9, mines: 28 },
  { floor: 9, rows: 12, cols: 10, mines: 34 },
  { floor: 10, rows: 13, cols: 10, mines: 40 },
];

export function getFloorConfig(
  floor: number,
  isMobile: boolean,
  ascensionLevel: AscensionLevel = 0
): FloorConfig {
  const configs = isMobile ? MOBILE_FLOOR_CONFIGS : FLOOR_CONFIGS;
  const index = Math.min(floor - 1, configs.length - 1);
  const baseConfig = configs[index];

  // A3: Add mine density bonus
  const modifiers = getAscensionModifiers(ascensionLevel);
  if (modifiers.mineDensityBonus > 0) {
    const bonusMines = Math.floor(baseConfig.mines * modifiers.mineDensityBonus);
    return {
      ...baseConfig,
      mines: baseConfig.mines + bonusMines,
    };
  }

  return baseConfig;
}

// Rarity weights for draft selection (must sum to 100)
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 5,
};

// Rarity display colors (for UI)
export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af', // Gray
  uncommon: '#22c55e', // Green
  rare: '#3b82f6', // Blue
  epic: '#a855f7', // Purple
};

// ==================== COMMON RELICS ====================
export const COMMON_POWER_UPS: PowerUp[] = [
  {
    id: 'edge-walker',
    name: 'Edge Walker',
    description: 'All 4 corner cells revealed (if safe) or flagged (if mine) at floor start',
    icon: '🧭',
    type: 'passive',
    rarity: 'common',
  },
  {
    id: 'danger-sense',
    name: 'Danger Sense',
    description: 'Up to 3 cells near 3+ mines have a subtle glow',
    icon: '⚠️',
    type: 'passive',
    rarity: 'common',
  },
  {
    id: 'cautious-start',
    name: 'Cautious Start',
    description: 'First click each floor guaranteed to have ≤2 adjacent mines',
    icon: '🐢',
    type: 'passive',
    rarity: 'common',
  },
  {
    id: 'heat-map',
    name: 'Heat Map',
    description: 'Revealed numbers tinted by danger (blue 1-2, orange 3-4, red 5+)',
    icon: '🌡️',
    type: 'passive',
    rarity: 'common',
  },
  {
    id: 'quick-recovery',
    name: 'Quick Recovery',
    description: 'If you die before revealing 10 cells, restart floor once per run',
    icon: '💫',
    type: 'passive',
    rarity: 'common',
  },
  {
    id: 'breathing-room',
    name: 'Breathing Room',
    description: 'First click each floor guarantees 2×2 safe area',
    icon: '🫁',
    type: 'passive',
    rarity: 'common',
  },
  {
    id: 'floor-scout',
    name: 'Floor Scout',
    description: 'At floor start, shows count of cells with 0 adjacent mines',
    icon: '🔍',
    type: 'passive',
    rarity: 'common',
  },
];

// ==================== UNCOMMON RELICS ====================
export const UNCOMMON_POWER_UPS: PowerUp[] = [
  {
    id: 'pattern-memory',
    name: 'Pattern Memory',
    description: 'After flagging a mine, diagonal cells glow green if safe',
    icon: '🧩',
    type: 'passive',
    rarity: 'uncommon',
  },
  {
    id: 'survey',
    name: 'Survey',
    description: 'Once per floor, reveal mine count in any row OR column',
    icon: '📊',
    type: 'active',
    rarity: 'uncommon',
    usesPerFloor: 1,
  },
  {
    id: 'momentum',
    name: 'Momentum',
    description: 'After cascade reveals 5+ cells, next click guaranteed safe',
    icon: '⚡',
    type: 'passive',
    rarity: 'uncommon',
  },
  {
    id: 'lucky-start',
    name: 'Lucky Start',
    description: 'First click reveals 3 additional safe cells in isolated areas',
    icon: '🍀',
    type: 'passive',
    rarity: 'uncommon',
  },
  {
    id: 'sixth-sense',
    name: 'Sixth Sense',
    description: 'First click redirected to nearest 0-cell for max cascade',
    icon: '✨',
    type: 'passive',
    rarity: 'uncommon',
  },
  {
    id: 'mine-detector',
    name: 'Mine Detector',
    description: 'Hover shows mine count in 5×5 area',
    icon: '📡',
    type: 'passive',
    rarity: 'uncommon',
  },
];

// ==================== RARE RELICS ====================
export const RARE_POWER_UPS: PowerUp[] = [
  {
    id: 'peek',
    name: 'Peek',
    description: 'Once per floor, preview a cell (see mine or number) without revealing',
    icon: '👀',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
  },
  {
    id: 'safe-path',
    name: 'Safe Path',
    description: 'Once per floor, reveal up to 5 safe cells in a chosen row or column',
    icon: '🛤️',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
  },
  {
    id: 'defusal-kit',
    name: 'Defusal Kit',
    description: 'Once per floor, remove a correctly flagged mine. Incorrect flags waste the charge',
    icon: '🔧',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    description: 'Survive one mine click per run (mine becomes flagged instead)',
    icon: '🛡️',
    type: 'passive',
    rarity: 'rare',
  },
  {
    id: 'x-ray-vision',
    name: 'X-Ray Vision',
    description: 'Once per floor, safely reveal 3×3 area (mines flagged, safe cells revealed)',
    icon: '👁️',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
  },
];

// ==================== EPIC RELICS ====================
export const EPIC_POWER_UPS: PowerUp[] = [
  {
    id: 'probability-lens',
    name: 'Probability Lens',
    description: 'Once per floor, highlights the safest unrevealed cell on the board',
    icon: '🔮',
    type: 'active',
    rarity: 'epic',
    usesPerFloor: 1,
  },
  {
    id: 'oracles-gift',
    name: "Oracle's Gift",
    description: 'All true 50/50 situations show the safe choice. BUT: +25% mine density',
    icon: '🌟',
    type: 'passive',
    rarity: 'epic',
  },
];

// Combined power-up pool (all relics)
export const POWER_UP_POOL: PowerUp[] = [
  ...COMMON_POWER_UPS,
  ...UNCOMMON_POWER_UPS,
  ...RARE_POWER_UPS,
  ...EPIC_POWER_UPS,
];

// Legacy constant for backwards compatibility (mine-detector was previously unlockable)
export const MINE_DETECTOR_POWER_UP: PowerUp = UNCOMMON_POWER_UPS.find(
  (p) => p.id === 'mine-detector'
)!;

// Scoring constants
export const SCORING = {
  BASE_CELL_REVEAL: 10, // Points per cell revealed
  FLOOR_CLEAR_BONUS: 100, // Bonus per floor cleared
  FLOOR_MULTIPLIER: 1.5, // Score multiplier increases per floor
  TIME_BONUS_THRESHOLD: 60, // Seconds under which time bonus kicks in
  TIME_BONUS_MULTIPLIER: 2, // Bonus multiplier for fast clears
};

// Look up a power-up by ID from all available powerups
export function getPowerUpById(id: PowerUpId): PowerUp | null {
  // Check the main pool first
  const fromPool = POWER_UP_POOL.find((p) => p.id === id);
  if (fromPool) return fromPool;

  // Check unlockable powerups
  if (MINE_DETECTOR_POWER_UP.id === id) return MINE_DETECTOR_POWER_UP;

  return null;
}

// Power-ups that require unlocking (not available by default)
export const UNLOCKABLE_POWER_UPS: PowerUpId[] = ['mine-detector'];

// Get available power-ups based on unlocks
export function getAvailablePowerUps(unlocks: PowerUpId[]): PowerUp[] {
  return POWER_UP_POOL.filter((p) => {
    // If it's an unlockable power-up, check if it's unlocked
    if (UNLOCKABLE_POWER_UPS.includes(p.id)) {
      return unlocks.includes(p.id);
    }
    // Otherwise, always available
    return true;
  });
}

// Select N random power-ups for draft using weighted rarity selection
export function selectDraftOptions(
  availablePool: PowerUp[],
  ownedIds: PowerUpId[],
  count: number = 3
): PowerUp[] {
  const filteredPool = availablePool.filter((p) => !ownedIds.includes(p.id));

  if (filteredPool.length === 0) return [];

  const selected: PowerUp[] = [];
  const remaining = [...filteredPool];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Calculate total weight of remaining power-ups
    const totalWeight = remaining.reduce((sum, p) => sum + RARITY_WEIGHTS[p.rarity], 0);

    // Pick a random point in the weight distribution
    let roll = Math.random() * totalWeight;

    // Find which power-up this roll corresponds to
    let selectedIndex = 0;
    for (let j = 0; j < remaining.length; j++) {
      roll -= RARITY_WEIGHTS[remaining[j].rarity];
      if (roll <= 0) {
        selectedIndex = j;
        break;
      }
    }

    // Add selected power-up and remove from remaining pool
    selected.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }

  return selected;
}

export const MAX_FLOOR = 10;
export const UNLOCK_FLOOR_5_REWARD: PowerUpId = 'mine-detector';
