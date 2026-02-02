import { describe, it, expect } from 'vitest';
import { getAscensionModifiers } from './ascension';

describe('getAscensionModifiers', () => {
  it('returns default modifiers for level 0', () => {
    const modifiers = getAscensionModifiers(0);

    expect(modifiers.draftChoices).toBe(3);
    expect(modifiers.timerCountdown).toBeNull();
    expect(modifiers.mineDensityBonus).toBe(0);
    expect(modifiers.amnesiaSeconds).toBeNull();
    expect(modifiers.toroidal).toBe(false);
  });

  it('progressively adds modifiers at each level', () => {
    // Level 1: reduced draft choices
    expect(getAscensionModifiers(1).draftChoices).toBe(2);

    // Level 2: adds timer
    expect(getAscensionModifiers(2).timerCountdown).toBe(90);

    // Level 3: adds mine density
    expect(getAscensionModifiers(3).mineDensityBonus).toBe(0.15);

    // Level 4: adds amnesia
    expect(getAscensionModifiers(4).amnesiaSeconds).toBe(8);

    // Level 5: adds toroidal
    expect(getAscensionModifiers(5).toroidal).toBe(true);
  });

  it('stacks all modifiers at max level', () => {
    const modifiers = getAscensionModifiers(5);

    expect(modifiers.draftChoices).toBe(2);
    expect(modifiers.timerCountdown).toBe(90);
    expect(modifiers.mineDensityBonus).toBe(0.15);
    expect(modifiers.amnesiaSeconds).toBe(8);
    expect(modifiers.toroidal).toBe(true);
  });
});
