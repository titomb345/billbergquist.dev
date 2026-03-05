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
  establishComeBetPoints,
} from '../../src/shared/craps/engine';
