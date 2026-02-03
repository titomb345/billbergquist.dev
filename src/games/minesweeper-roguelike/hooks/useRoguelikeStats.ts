import { useState, useCallback } from 'react';
import { RoguelikeStats } from '../types';
import { saveStats, loadStats } from '../persistence';
import { AscensionLevel, MAX_ASCENSION } from '../ascension';

export function useRoguelikeStats() {
  // Use lazy initialization - loadStats is called once during initial render
  const [stats, setStats] = useState<RoguelikeStats>(() => loadStats());

  const recordRun = useCallback(
    (floorReached: number, score: number, ascensionLevel: AscensionLevel, isVictory: boolean) => {
      setStats((prev) => {
        // Track ascension progress
        let newHighestAscensionUnlocked = prev.highestAscensionUnlocked;
        let newHighestAscensionCleared = prev.highestAscensionCleared;

        if (isVictory) {
          // Track highest cleared
          if (ascensionLevel > newHighestAscensionCleared) {
            newHighestAscensionCleared = ascensionLevel;
          }
          // Unlock next ascension level on victory
          if (ascensionLevel < MAX_ASCENSION && ascensionLevel >= newHighestAscensionUnlocked) {
            newHighestAscensionUnlocked = (ascensionLevel + 1) as AscensionLevel;
          }
        }

        const newStats: RoguelikeStats = {
          totalRuns: prev.totalRuns + 1,
          bestFloor: Math.max(prev.bestFloor, floorReached),
          bestScore: Math.max(prev.bestScore, score),
          floorsCleared: prev.floorsCleared + floorReached - 1, // Don't count current floor if died
          highestAscensionUnlocked: newHighestAscensionUnlocked,
          highestAscensionCleared: newHighestAscensionCleared,
        };

        saveStats(newStats);
        return newStats;
      });
    },
    []
  );

  const resetStats = useCallback(() => {
    const defaultStats: RoguelikeStats = {
      totalRuns: 0,
      bestFloor: 0,
      bestScore: 0,
      floorsCleared: 0,
      highestAscensionUnlocked: 0,
      highestAscensionCleared: 0,
    };
    setStats(defaultStats);
    saveStats(defaultStats);
  }, []);

  return {
    stats,
    recordRun,
    resetStats,
  };
}
