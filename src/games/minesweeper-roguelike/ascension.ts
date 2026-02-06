// Ascension system - progressive difficulty modifiers that unlock after beating floor 10
// Each level adds its effect on top of all previous levels (A3 includes A1+A2+A3 effects)

export type AscensionLevel = 0 | 1 | 2 | 3 | 4 | 5;
export const MAX_ASCENSION: AscensionLevel = 5;

export interface AscensionModifiers {
  coldStart: boolean; // A1: first click doesn't guarantee cascade
  draftChoices: number; // A2: 2 or 3
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
  1: { name: 'Ascension I', description: "Cold Start — First click doesn't guarantee a cascade." },
  2: { name: 'Ascension II', description: 'Narrow Draft — Draft 2 power-ups instead of 3.' },
  3: { name: 'Ascension III', description: 'Mine Pressure — Floors contain 15% more mines.' },
  4: { name: 'Ascension IV', description: 'Amnesia — Numbers fade after 8 seconds.' },
  5: { name: 'Ascension V', description: 'Toroidal — The board wraps at the edges.' },
};

export function getAscensionModifiers(level: AscensionLevel): AscensionModifiers {
  return {
    coldStart: level >= 1,
    draftChoices: level >= 2 ? 2 : 3,
    mineDensityBonus: level >= 3 ? 0.15 : 0,
    amnesiaSeconds: level >= 4 ? 8 : null,
    toroidal: level >= 5,
  };
}
