// Migration functions: transform state from version N to N+1
// Each migration receives the previous version's shape and returns the next

type MigrationFn = (state: unknown) => unknown;

// Game state migrations
// Key N transforms version N to version N+1
export const gameStateMigrations: Record<number, MigrationFn> = {
  // v0 (legacy saves without version) → v1
  // Legacy saves should already have the correct shape, just add version compliance
  0: (state: unknown) => {
    const s = state as Record<string, unknown>;
    // Ensure all required fields exist with defaults if missing
    return {
      phase: s.phase ?? 'start',
      board: s.board ?? [],
      floorConfig: s.floorConfig ?? { floor: 1, rows: 9, cols: 9, mines: 10 },
      minesRemaining: s.minesRemaining ?? 10,
      time: s.time ?? 0,
      isFirstClick: s.isFirstClick ?? true,
      isMobile: s.isMobile ?? false,
      run: s.run ?? {
        currentFloor: 1,
        score: 0,
        activePowerUps: [],
        ironWillAvailable: true,
        xRayUsedThisFloor: false,
        luckyStartUsedThisFloor: false,
        seed: 'LEGACY',
      },
      draftOptions: s.draftOptions ?? [],
      dangerCells: s.dangerCells ?? [],
      explodedCell: s.explodedCell ?? null,
      closeCallCell: s.closeCallCell ?? null,
    };
  },
  // v1 → v2: Add ascensionLevel to run state
  1: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    return {
      ...s,
      run: {
        ...run,
        ascensionLevel: run.ascensionLevel ?? 0,
      },
    };
  },
  // v2 → v3: Remove unlocks (all powerups now always available)
  2: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const { unlocks: _, ...rest } = s;
    return rest;
  },
  // v3 → v4: Iron Will rework - convert ironWillAvailable to ironWillUsedThisFloor + traumaStacks
  3: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    // Map ironWillAvailable: true → ironWillUsedThisFloor: false (shield available)
    // Map ironWillAvailable: false → ironWillUsedThisFloor: true (shield used)
    const ironWillAvailable = run.ironWillAvailable ?? true;
    const { ironWillAvailable: _, ...restRun } = run;
    return {
      ...s,
      run: {
        ...restRun,
        ironWillUsedThisFloor: !ironWillAvailable,
        traumaStacks: 0, // Old saves start with 0 trauma
      },
    };
  },
  // v4 → v5: Mine Detector rework - add scan fields
  4: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    return {
      ...s,
      mineDetectorScannedCells: [],
      mineDetectorResult: null,
      run: {
        ...run,
        mineDetectorScansRemaining: 3,
      },
    };
  },
  // v5 → v6: Sixth Sense rework - add charge/arm/triggered fields
  5: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    return {
      ...s,
      sixthSenseTriggered: false,
      run: {
        ...run,
        sixthSenseChargesRemaining: 1,
        sixthSenseArmed: false,
      },
    };
  },
  // v6 → v7: Quick Recovery rebalance - add per-floor eligibility tracking
  6: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    return {
      ...s,
      run: {
        ...run,
        quickRecoveryEligibleThisFloor: true,
      },
    };
  },
  // v7 → v8: Survey rebalance - convert boolean to charges, single result to persisted map
  7: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    const surveyUsed = run.surveyUsedThisFloor === true;
    const { surveyUsedThisFloor: _, ...restRun } = run;

    // Convert old single surveyResult to surveyedRows array
    const oldResult = s.surveyResult as { direction: string; index: number; mineCount: number } | null;
    const surveyedRows: [number, number][] = [];
    if (oldResult && oldResult.direction === 'row') {
      surveyedRows.push([oldResult.index, oldResult.mineCount]);
    }
    const { surveyResult: __, ...restState } = s;

    return {
      ...restState,
      surveyedRows,
      run: {
        ...restRun,
        surveyChargesRemaining: surveyUsed ? 0 : 2,
      },
    };
  },
  // v8 → v9: Replace Cautious Start with False Start - add per-floor state
  8: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    return {
      ...s,
      falseStartTriggered: false,
      run: {
        ...run,
        falseStartAvailableThisFloor: true,
      },
    };
  },
  // v9 → v10: Pattern Memory once-per-floor limit
  9: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const run = (s.run ?? {}) as Record<string, unknown>;
    return {
      ...s,
      run: {
        ...run,
        patternMemoryAvailableThisFloor: true,
      },
    };
  },
};

// Stats migrations
export const statsMigrations: Record<number, MigrationFn> = {
  // v0 (legacy saves without version) → v1
  0: (state: unknown) => {
    const s = state as Record<string, unknown>;
    return {
      totalRuns: s.totalRuns ?? 0,
      bestFloor: s.bestFloor ?? 0,
      bestScore: s.bestScore ?? 0,
      floorsCleared: s.floorsCleared ?? 0,
    };
  },
  // v1 → v2: Add ascension tracking fields
  1: (state: unknown) => {
    const s = state as Record<string, unknown>;
    return {
      ...s,
      highestAscensionUnlocked: s.highestAscensionUnlocked ?? 0,
      highestAscensionCleared: s.highestAscensionCleared ?? 0,
    };
  },
  // v2 → v3: Remove unlocks (all powerups now always available)
  2: (state: unknown) => {
    const s = state as Record<string, unknown>;
    const { unlocks: _, ...rest } = s;
    return rest;
  },
};

export function applyMigrations(
  state: unknown,
  fromVersion: number,
  toVersion: number,
  migrations: Record<number, MigrationFn>
): unknown {
  let current = state;
  for (let v = fromVersion; v < toVersion; v++) {
    const migration = migrations[v];
    if (migration) {
      current = migration(current);
    } else {
      // Warn about missing migration - this indicates a gap in the migration chain
      console.warn(
        `Missing migration from v${v} to v${v + 1}. ` +
          `This may cause data loss if schema changed between versions.`
      );
    }
  }
  return current;
}
