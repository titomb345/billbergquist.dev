import { FloorConfig, PowerUp, PowerUpId, Rarity } from './types';
import { AscensionLevel, getAscensionModifiers } from './ascension';

// Floor configurations - monotonic density ramp from ~17% to ~29%
// F1:16.7% F2:18.4% F3:20.3% F4:21.9% F5:22.2% F6:23.5% F7:24.0% F8:28.0% F9:28.9% F10:29.2%
export const FLOOR_CONFIGS: FloorConfig[] = [
  { floor: 1, rows: 6, cols: 6, mines: 6 },
  { floor: 2, rows: 7, cols: 7, mines: 9 },
  { floor: 3, rows: 8, cols: 8, mines: 13 },
  { floor: 4, rows: 8, cols: 8, mines: 14 },
  { floor: 5, rows: 9, cols: 9, mines: 18 },
  { floor: 6, rows: 9, cols: 9, mines: 19 },
  { floor: 7, rows: 10, cols: 10, mines: 24 },
  { floor: 8, rows: 10, cols: 10, mines: 28 },
  { floor: 9, rows: 11, cols: 11, mines: 35 },
  { floor: 10, rows: 12, cols: 12, mines: 42 },
];

// Mobile floor configs - keep boards more square/portrait-oriented
// Density matched to desktop: ~17% → ~29% monotonic ramp
export const MOBILE_FLOOR_CONFIGS: FloorConfig[] = [
  { floor: 1, rows: 6, cols: 6, mines: 6 },
  { floor: 2, rows: 7, cols: 7, mines: 9 },
  { floor: 3, rows: 8, cols: 8, mines: 13 },
  { floor: 4, rows: 9, cols: 8, mines: 16 },
  { floor: 5, rows: 10, cols: 8, mines: 18 },
  { floor: 6, rows: 10, cols: 9, mines: 21 },
  { floor: 7, rows: 11, cols: 9, mines: 24 },
  { floor: 8, rows: 12, cols: 9, mines: 30 },
  { floor: 9, rows: 12, cols: 10, mines: 35 },
  { floor: 10, rows: 13, cols: 10, mines: 38 },
];

// Mine density modifier for tooltip display
export interface MineDensityBreakdownItem {
  label: string;
  percent: number; // raw modifier % (e.g., 12 for Oracle's Gift)
}

// Complete density info returned by the single source of truth function
export interface MineDensityInfo {
  baseMines: number;
  bonusMines: number;
  effectiveMines: number;
  totalCells: number;
  effectiveDensityPercent: number; // 0-100
  modifiers: MineDensityBreakdownItem[]; // active modifiers with their % rates
  projectedNextFloor: {
    effectiveDensityPercent: number;
    traumaBonusPercent: number;
  } | null;
}

// Single source of truth for mine density calculation.
// Used for BOTH mine placement (via getFloorConfig) and HUD display.
export function computeMineDensityForFloor(params: {
  floor: number;
  isMobile: boolean;
  ascensionLevel: AscensionLevel;
  hasOraclesGift: boolean;
  traumaStacks: number; // trauma at floor generation time (for "this floor")
  currentTraumaStacks?: number; // current trauma (may be higher if Iron Will triggered mid-floor)
}): MineDensityInfo {
  const { floor, isMobile, ascensionLevel, hasOraclesGift, traumaStacks } = params;
  const currentTraumaStacks = params.currentTraumaStacks ?? traumaStacks;

  const configs = isMobile ? MOBILE_FLOOR_CONFIGS : FLOOR_CONFIGS;
  const index = Math.min(floor - 1, configs.length - 1);
  const baseConfig = configs[index];
  const totalCells = baseConfig.rows * baseConfig.cols;

  const modifiers = getAscensionModifiers(ascensionLevel);
  const oracleBonus = hasOraclesGift ? ORACLES_GIFT_MINE_DENSITY_BONUS : 0;
  const traumaBonus = traumaStacks * 0.05;
  const totalDensityBonus = modifiers.mineDensityBonus + oracleBonus + traumaBonus;

  const bonusMines = totalDensityBonus > 0 ? Math.floor(baseConfig.mines * totalDensityBonus) : 0;
  const effectiveMines = baseConfig.mines + bonusMines;
  const effectiveDensityPercent = (effectiveMines / totalCells) * 100;

  // Build modifiers list (only active ones)
  const densityModifiers: MineDensityBreakdownItem[] = [];
  if (modifiers.mineDensityBonus > 0) {
    densityModifiers.push({ label: 'Ascension (A3)', percent: modifiers.mineDensityBonus * 100 });
  }
  if (hasOraclesGift) {
    densityModifiers.push({
      label: "Oracle's Gift",
      percent: ORACLES_GIFT_MINE_DENSITY_BONUS * 100,
    });
  }
  if (traumaBonus > 0) {
    densityModifiers.push({ label: 'Iron Will Trauma', percent: traumaBonus * 100 });
  }

  // Next floor projection (only if trauma stacks exist)
  let projectedNextFloor: MineDensityInfo['projectedNextFloor'] = null;
  if (currentTraumaStacks > 0 && floor < configs.length) {
    const nextFloor = floor + 1;
    const nextIndex = nextFloor - 1;
    const nextBaseConfig = configs[nextIndex];
    const nextTotalCells = nextBaseConfig.rows * nextBaseConfig.cols;
    const nextTraumaBonus = currentTraumaStacks * 0.05;
    const nextTotalDensityBonus = modifiers.mineDensityBonus + oracleBonus + nextTraumaBonus;
    const nextBonusMines =
      nextTotalDensityBonus > 0 ? Math.floor(nextBaseConfig.mines * nextTotalDensityBonus) : 0;
    const nextEffectiveMines = nextBaseConfig.mines + nextBonusMines;
    projectedNextFloor = {
      effectiveDensityPercent: (nextEffectiveMines / nextTotalCells) * 100,
      traumaBonusPercent: currentTraumaStacks * 5,
    };
  }

  return {
    baseMines: baseConfig.mines,
    bonusMines,
    effectiveMines,
    totalCells,
    effectiveDensityPercent,
    modifiers: densityModifiers,
    projectedNextFloor,
  };
}

export function getFloorConfig(
  floor: number,
  isMobile: boolean,
  ascensionLevel: AscensionLevel = 0,
  extraMineDensityBonus: number = 0, // Additional mine density modifier (e.g., 0.12 for Oracle's Gift)
  traumaStacks: number = 0 // Iron Will trauma stacks (+5% per stack)
): FloorConfig {
  const configs = isMobile ? MOBILE_FLOOR_CONFIGS : FLOOR_CONFIGS;
  const index = Math.min(floor - 1, configs.length - 1);
  const baseConfig = configs[index];

  // Delegate to the single source of truth
  const densityInfo = computeMineDensityForFloor({
    floor,
    isMobile,
    ascensionLevel,
    hasOraclesGift: extraMineDensityBonus > 0,
    traumaStacks,
  });

  return {
    ...baseConfig,
    mines: densityInfo.effectiveMines,
  };
}

// Rarity weights for draft selection (must sum to 100)
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  uncommon: 30,
  rare: 8,
  epic: 2,
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
    id: 'false-start',
    name: 'False Start',
    description: 'Once per floor, your first incorrect flag is forgiven',
    icon: '🚩',
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
    id: 'quick-recovery',
    name: 'Quick Recovery',
    description: 'If you die before reaching 25% floor progress, restart floor once per run',
    icon: '💫',
    type: 'passive',
    rarity: 'uncommon',
  },
  {
    id: 'pattern-memory',
    name: 'Pattern Memory',
    description: 'Once per floor, revealing a 3+ cell highlights a safe neighbor',
    icon: '🧩',
    type: 'passive',
    rarity: 'uncommon',
  },
  {
    id: 'survey',
    name: 'Survey',
    description: 'Survey a row to learn exactly how many mines it contains. (2 uses per floor)',
    icon: '📊',
    type: 'active',
    rarity: 'uncommon',
    usesPerFloor: 2,
    activeHint: 'Click a row marker to count mines in that row',
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
];

// ==================== RARE RELICS ====================
export const RARE_POWER_UPS: PowerUp[] = [
  {
    id: 'mine-detector',
    name: 'Mine Detector',
    description:
      'Scan a 4×4 region to learn how many mines it contains. 3 scans per floor. Each cell can only be scanned once per floor.',
    icon: '📡',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 3,
    activeHint: 'Click a cell to scan for nearby mines',
  },
  {
    id: 'peek',
    name: 'Peek',
    description: 'Once per floor, glimpse a cell for 2 seconds (see mine or number)',
    icon: '👀',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
    activeHint: 'Click a cell to peek at it',
  },
  {
    id: 'safe-path',
    name: 'Safe Path',
    description: 'Once per floor, reveal up to 3 safe cells in a chosen row',
    icon: '🛤️',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
    activeHint: 'Click a cell to reveal safe cells in that row',
  },
  {
    id: 'defusal-kit',
    name: 'Defusal Kit',
    description:
      'Once per floor, remove a correctly flagged mine. Incorrect flags waste the charge',
    icon: '🔧',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
    activeHint: 'Click a flagged mine to remove it',
  },
  {
    id: 'x-ray-vision',
    name: 'X-Ray Vision',
    description: 'Once per floor, safely reveal 3×3 area (mines flagged, safe cells revealed)',
    icon: '👁️',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
    activeHint: 'Click a cell to reveal 3×3 area',
  },
  {
    id: 'sixth-sense',
    name: 'Sixth Sense',
    description:
      'Arm to redirect your next non-zero reveal into a cascade (once per floor). Does not consume a charge unless a redirect occurs.',
    icon: '✨',
    type: 'active',
    rarity: 'rare',
    usesPerFloor: 1,
    activeHint: 'Sixth Sense armed — click a cell to trigger cascade redirect',
  },
];

// ==================== EPIC RELICS ====================
export const EPIC_POWER_UPS: PowerUp[] = [
  {
    id: 'probability-lens',
    name: 'Probability Lens',
    description: 'Once per floor, highlights the 3 safest unrevealed cells on the board',
    icon: '🔮',
    type: 'active',
    rarity: 'epic',
    usesPerFloor: 1,
    activeHint: 'Click to highlight the 3 safest cells',
  },
  {
    id: 'oracles-gift',
    name: "Oracle's Gift",
    description: 'All true 50/50 situations show the safe choice. BUT: +12% mine density',
    icon: '🌟',
    type: 'passive',
    rarity: 'epic',
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    description:
      'Survive one mine click per floor. Each trigger permanently increases mine density by 5%.',
    icon: '🛡️',
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

// All power-up IDs derived from the pool (used for validation in persistence)
export const ALL_POWER_UP_IDS = POWER_UP_POOL.map((p) => p.id);

// Scoring constants
export const SCORING = {
  BASE_CELL_REVEAL: 10, // Points per cell revealed
  FLOOR_CLEAR_BONUS: 100, // Bonus per floor cleared
  FLOOR_MULTIPLIER: 1.5, // Score multiplier increases per floor
  TIME_BONUS_THRESHOLD: 60, // Seconds under which time bonus kicks in
  TIME_BONUS_MULTIPLIER: 2, // Bonus multiplier for fast clears
};

// Look up a power-up by ID
export function getPowerUpById(id: PowerUpId): PowerUp | null {
  return POWER_UP_POOL.find((p) => p.id === id) ?? null;
}

// Get all available power-ups for drafting
export function getAvailablePowerUps(): PowerUp[] {
  return POWER_UP_POOL;
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

// Oracle's Gift mine density bonus (+12%)
export const ORACLES_GIFT_MINE_DENSITY_BONUS = 0.12;
