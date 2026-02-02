// Ascension system - progressive difficulty modifiers that unlock after beating floor 10
// Each level adds its effect on top of all previous levels (A3 includes A1+A2+A3 effects)

export type AscensionLevel = 0 | 1 | 2 | 3 | 4 | 5;
export const MAX_ASCENSION: AscensionLevel = 5;

export interface AscensionModifiers {
  draftChoices: number; // A1: 2 or 3
  timerCountdown: number | null; // A2: 90 or null
  mineDensityBonus: number; // A3: 0.15 or 0
  amnesiaSeconds: number | null; // A4: 8 or null
  toroidal: boolean; // A5: wrap-around numbers
}

export interface AscensionInfo {
  name: string;
  description: string;
}

export const ASCENSION_INFO: Record<AscensionLevel, AscensionInfo> = {
  0: { name: 'Normal', description: 'Standard difficulty' },
  1: { name: 'Ascension I', description: 'Only 2 power-up choices' },
  2: { name: 'Ascension II', description: '90s countdown timer' },
  3: { name: 'Ascension III', description: '+15% mine density' },
  4: { name: 'Ascension IV', description: 'Numbers fade after 8s' },
  5: { name: 'Ascension V', description: 'Board wraps at edges' },
};

export function getAscensionModifiers(level: AscensionLevel): AscensionModifiers {
  return {
    draftChoices: level >= 1 ? 2 : 3,
    timerCountdown: level >= 2 ? 90 : null,
    mineDensityBonus: level >= 3 ? 0.15 : 0,
    amnesiaSeconds: level >= 4 ? 8 : null,
    toroidal: level >= 5,
  };
}
