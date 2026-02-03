export { GAME_STATE_VERSION, STATS_VERSION, isKnownPowerUpId, KNOWN_POWER_UP_IDS } from './schemas';
export {
  saveGameState,
  loadGameState,
  clearGameState,
  saveStats,
  loadStats,
  clearStats,
} from './storage';
