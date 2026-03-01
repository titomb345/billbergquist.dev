import { z } from 'zod';

export const STATS_VERSION = 1;

export const GridlockStatsSchema = z.object({
  version: z.number().int().min(1),
  checksum: z.string(),
  gamesPlayed: z.number().int().min(0),
  bestScore: z.number().int().min(0),
  bestLevel: z.number().int().min(0),
  totalLines: z.number().int().min(0),
  playerName: z.string().max(20).default(''),
});
