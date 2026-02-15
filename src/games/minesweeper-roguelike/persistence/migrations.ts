// Migration functions: transform state from version N to N+1
// Each migration receives the previous version's shape and returns the next
//
// CURRENTLY DISABLED — during pre-v1 balancing, version mismatches wipe the save.
//
// HOW TO RE-ENABLE MIGRATIONS:
// 1. schemas.ts — bump GAME_STATE_VERSION (and/or STATS_VERSION)
// 2. This file — add migration functions to gameStateMigrations / statsMigrations
//    Example: 1: (state) => { const s = state as Record<string, unknown>; return { ...s, newField: defaultValue }; }
// 3. storage.ts — uncomment the import on line ~8:
//    import { applyMigrations, gameStateMigrations, statsMigrations } from './migrations';
// 4. storage.ts loadGameState() — replace the "version mismatch → wipe" block with:
//    const migrated = version < GAME_STATE_VERSION
//      ? applyMigrations(parsed, version, GAME_STATE_VERSION, gameStateMigrations)
//      : parsed;
//    Then pass `migrated` (not `parsed`) to SerializedGameStateSchema.safeParse()
// 5. storage.ts loadStats() — same pattern with statsMigrations + STATS_VERSION

type MigrationFn = (state: unknown) => unknown;

// Game state migrations (key N transforms version N to version N+1)
export const gameStateMigrations: Record<number, MigrationFn> = {};

// Stats migrations
export const statsMigrations: Record<number, MigrationFn> = {};

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
      console.warn(
        `Missing migration from v${v} to v${v + 1}. ` +
          `This may cause data loss if schema changed between versions.`
      );
    }
  }
  return current;
}
