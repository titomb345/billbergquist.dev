// Re-export all types from shared source of truth
export type {
  CrapsPhase,
  BetType,
  Bet,
  DiceRoll,
  BetResolution,
  Player,
  CrapsGameState,
  ReactionKey,
  CrapsClientMessage,
  CrapsServerMessage,
} from '../../src/shared/craps/types';

export { STARTING_BALANCE, MAX_PLAYERS } from '../../src/shared/craps/types';
