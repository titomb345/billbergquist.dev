// Re-export all engine functions from shared source of truth
export {
  rollDice,
  resolveComeOutRoll,
  resolvePointPhaseRoll,
  calculatePayout,
  getMaxOdds,
  getMaxDontOdds,
  validateBet,
  isContractBet,
  isPlaceBet,
  establishComeBetPoints,
  snapBetAmount,
  aggregateBets,
} from '../shared/craps/engine';

export type { AggregatedBet } from '../shared/craps/engine';
