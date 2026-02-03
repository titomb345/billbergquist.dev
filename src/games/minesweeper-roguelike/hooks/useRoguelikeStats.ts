import { useState, useCallback } from 'react';
import { RoguelikeStats } from '../types';
import { saveStats, loadStats } from '../persistence';
import { AscensionLevel, MAX_ASCENSION } from '../ascension';

export function useRoguelikeStats() {
  const [stats, setStats] = useState<RoguelikeStats>(() => loadStats());

  const recordRun = useCallback(
    (floorReached: number, score: number, ascensionLevel: AscensionLevel, isVictory: boolean) => {
      setStats((prev) => {
        let newHighestAscensionUnlocked = prev.highestAscensionUnlocked;
        let newHighestAscensionCleared = prev.highestAscensionCleared;

        if (isVictory) {
          if (ascensionLevel > newHighestAscensionCleared) {
            newHighestAscensionCleared = ascensionLevel;
          }
          if (ascensionLevel < MAX_ASCENSION && ascensionLevel >= newHighestAscensionUnlocked) {
            newHighestAscensionUnlocked = (ascensionLevel + 1) as AscensionLevel;
          }
        }

        const newStats: RoguelikeStats = {
          totalRuns: prev.totalRuns + 1,
          bestFloor: Math.max(prev.bestFloor, floorReached),
          bestScore: Math.max(prev.bestScore, score),
          floorsCleared: prev.floorsCleared + floorReached - 1,
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
