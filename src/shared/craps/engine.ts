import type { Bet, BetResolution, BetType, CrapsGameState, DiceRoll } from './types';

export function rollDice(): DiceRoll {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return { die1, die2, total: die1 + die2 };
}

// ── Resolution Helpers ──

function makeResolution(bet: Bet, payout: number): BetResolution {
  return { betId: bet.id, playerId: bet.playerId, betType: bet.type, amount: bet.amount, payout };
}

// ── One-Roll Bet Resolution ──

function resolveOneRollBets(bets: Bet[], roll: DiceRoll): BetResolution[] {
  const resolutions: BetResolution[] = [];
  const total = roll.total;

  for (const bet of bets) {
    switch (bet.type) {
      case 'anyCraps':
        resolutions.push(makeResolution(bet, (total === 2 || total === 3 || total === 12) ? bet.amount * 7 : -bet.amount));
        break;
      case 'anySeven':
        resolutions.push(makeResolution(bet, total === 7 ? bet.amount * 4 : -bet.amount));
        break;
      case 'yo':
        resolutions.push(makeResolution(bet, total === 11 ? bet.amount * 15 : -bet.amount));
        break;
      case 'horn':
        if (total === 2 || total === 12) {
          resolutions.push(makeResolution(bet, Math.floor(27 * bet.amount / 4)));
        } else if (total === 3 || total === 11) {
          resolutions.push(makeResolution(bet, 3 * bet.amount));
        } else {
          resolutions.push(makeResolution(bet, -bet.amount));
        }
        break;
    }
  }
  return resolutions;
}

// ── Hardway Bet Resolution (point phase only) ──

function resolveHardwayBets(bets: Bet[], roll: DiceRoll): BetResolution[] {
  const resolutions: BetResolution[] = [];
  const isHard = roll.die1 === roll.die2;

  for (const bet of bets) {
    const hardNum = getHardwayNumber(bet.type);
    if (hardNum === 0) continue;

    if (roll.total === hardNum) {
      if (isHard) {
        const payout = (hardNum === 4 || hardNum === 10) ? bet.amount * 7 : bet.amount * 9;
        resolutions.push(makeResolution(bet, payout));
      } else {
        resolutions.push(makeResolution(bet, -bet.amount));
      }
    } else if (roll.total === 7) {
      resolutions.push(makeResolution(bet, -bet.amount));
    }
  }
  return resolutions;
}

// ── Come-Out Roll Resolution ──

export function resolveComeOutRoll(
  bets: Bet[],
  roll: DiceRoll,
): { resolutions: BetResolution[]; newPoint: number | null } {
  const resolutions: BetResolution[] = [];
  const total = roll.total;

  resolutions.push(...resolveOneRollBets(bets, roll));

  if (total === 7 || total === 11) {
    for (const bet of bets) {
      if (bet.type === 'pass') {
        resolutions.push(makeResolution(bet, bet.amount));
      } else if (bet.type === 'dontPass') {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'field') {
        resolutions.push(resolveFieldBet(bet, total));
      }
    }
    return { resolutions, newPoint: null };
  }

  if (total === 2 || total === 3 || total === 12) {
    for (const bet of bets) {
      if (bet.type === 'pass') {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'dontPass') {
        resolutions.push(makeResolution(bet, total === 12 ? 0 : bet.amount));
      } else if (bet.type === 'field') {
        resolutions.push(resolveFieldBet(bet, total));
      }
    }
    return { resolutions, newPoint: null };
  }

  // Point established (4, 5, 6, 8, 9, 10)
  for (const bet of bets) {
    if (bet.type === 'field') {
      resolutions.push(resolveFieldBet(bet, total));
    }
  }

  return { resolutions, newPoint: total };
}

// ── Point Phase Roll Resolution ──

export function resolvePointPhaseRoll(
  bets: Bet[],
  roll: DiceRoll,
  point: number,
): { resolutions: BetResolution[]; pointMade: boolean; sevenOut: boolean } {
  const resolutions: BetResolution[] = [];
  const total = roll.total;

  resolutions.push(...resolveOneRollBets(bets, roll));
  resolutions.push(...resolveHardwayBets(bets, roll));

  // Point made
  if (total === point) {
    for (const bet of bets) {
      if (bet.type === 'pass') {
        resolutions.push(makeResolution(bet, bet.amount));
      } else if (bet.type === 'dontPass') {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'passOdds') {
        resolutions.push(makeResolution(bet, calculateOddsPayout(bet.amount, point)));
      } else if (bet.type === 'dontPassOdds') {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'come' && bet.point === point) {
        resolutions.push(makeResolution(bet, bet.amount));
      } else if (bet.type === 'dontCome' && bet.point === point) {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'comeOdds' && bet.point === point) {
        resolutions.push(makeResolution(bet, calculateOddsPayout(bet.amount, point)));
      } else if (bet.type === 'dontComeOdds' && bet.point === point) {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (isPlaceBet(bet.type) && getPlaceNumber(bet.type) === point) {
        resolutions.push(makeResolution(bet, calculatePlacePayout(bet.type, bet.amount)));
      } else if (bet.type === 'field') {
        resolutions.push(resolveFieldBet(bet, total));
      }
    }
    return { resolutions, pointMade: true, sevenOut: false };
  }

  // Seven-out
  if (total === 7) {
    for (const bet of bets) {
      if (bet.type === 'pass' || bet.type === 'passOdds') {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'dontPass') {
        resolutions.push(makeResolution(bet, bet.amount));
      } else if (bet.type === 'dontPassOdds') {
        resolutions.push(makeResolution(bet, calculateDontOddsPayout(bet.amount, point)));
      } else if (bet.type === 'come') {
        resolutions.push(makeResolution(bet, bet.point ? -bet.amount : bet.amount));
      } else if (bet.type === 'dontCome') {
        resolutions.push(makeResolution(bet, bet.point ? bet.amount : -bet.amount));
      } else if (bet.type === 'comeOdds') {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'dontComeOdds') {
        resolutions.push(makeResolution(bet, calculateDontOddsPayout(bet.amount, bet.point!)));
      } else if (isPlaceBet(bet.type)) {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (bet.type === 'field') {
        resolutions.push(resolveFieldBet(bet, total));
      }
    }
    return { resolutions, pointMade: false, sevenOut: true };
  }

  // Other number rolled during point phase
  for (const bet of bets) {
    if (bet.type === 'come' && !bet.point) {
      if (total === 11) {
        resolutions.push(makeResolution(bet, bet.amount));
      } else if (total === 2 || total === 3 || total === 12) {
        resolutions.push(makeResolution(bet, -bet.amount));
      }
    }

    if (bet.type === 'dontCome' && !bet.point) {
      if (total === 11) {
        resolutions.push(makeResolution(bet, -bet.amount));
      } else if (total === 2 || total === 3) {
        resolutions.push(makeResolution(bet, bet.amount));
      } else if (total === 12) {
        resolutions.push(makeResolution(bet, 0));
      }
    }

    if (bet.type === 'come' && bet.point === total) {
      resolutions.push(makeResolution(bet, bet.amount));
    }

    if (bet.type === 'dontCome' && bet.point === total) {
      resolutions.push(makeResolution(bet, -bet.amount));
    }

    if (bet.type === 'comeOdds' && bet.point === total) {
      resolutions.push(makeResolution(bet, calculateOddsPayout(bet.amount, total)));
    }

    if (bet.type === 'dontComeOdds' && bet.point === total) {
      resolutions.push(makeResolution(bet, -bet.amount));
    }

    if (isPlaceBet(bet.type) && total === getPlaceNumber(bet.type)) {
      resolutions.push(makeResolution(bet, calculatePlacePayout(bet.type, bet.amount)));
    }

    if (bet.type === 'field') {
      resolutions.push(resolveFieldBet(bet, total));
    }
  }

  return { resolutions, pointMade: false, sevenOut: false };
}

// ── Field Bet ──

function resolveFieldBet(bet: Bet, total: number): BetResolution {
  if (total === 2) return makeResolution(bet, bet.amount * 2); // 2:1
  if (total === 12) return makeResolution(bet, bet.amount * 3); // 3:1
  if (total === 3 || total === 4 || total === 9 || total === 10 || total === 11) {
    return makeResolution(bet, bet.amount); // 1:1
  }
  return makeResolution(bet, -bet.amount);
}

// ── Odds Payouts ──

function calculateOddsPayout(amount: number, point: number): number {
  switch (point) {
    case 4: case 10: return amount * 2;
    case 5: case 9: return Math.floor(amount * 3 / 2);
    case 6: case 8: return Math.floor(amount * 6 / 5);
    default: return amount;
  }
}

function calculateDontOddsPayout(amount: number, point: number): number {
  switch (point) {
    case 4: case 10: return Math.floor(amount / 2);
    case 5: case 9: return Math.floor(amount * 2 / 3);
    case 6: case 8: return Math.floor(amount * 5 / 6);
    default: return amount;
  }
}

export function calculatePayout(betType: BetType, amount: number, point: number | null): number {
  if (isPlaceBet(betType)) return calculatePlacePayout(betType, amount);
  switch (betType) {
    case 'pass': case 'dontPass': case 'come': case 'dontCome': return amount;
    case 'field': return amount;
    case 'passOdds': case 'comeOdds': return point ? calculateOddsPayout(amount, point) : amount;
    case 'dontPassOdds': case 'dontComeOdds': return point ? calculateDontOddsPayout(amount, point) : amount;
    case 'hard4': case 'hard10': return amount * 7;
    case 'hard6': case 'hard8': return amount * 9;
    case 'anyCraps': return amount * 7;
    case 'anySeven': return amount * 4;
    case 'yo': return amount * 15;
    case 'horn': return Math.floor(27 * amount / 4);
    default: return amount;
  }
}

// ── Max Odds ──

export function getMaxOdds(point: number, flatBet: number): number {
  switch (point) {
    case 4: case 10: return flatBet * 3;
    case 5: case 9: return flatBet * 4;
    case 6: case 8: return flatBet * 5;
    default: return flatBet * 3;
  }
}

export function getMaxDontOdds(point: number, flatBet: number): number {
  return flatBet * 6;
}

// ── Bet Validation ──

export function validateBet(
  state: CrapsGameState,
  playerId: string,
  betType: BetType,
  amount: number,
  betPoint?: number,
): string | null {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 'Player not found';
  if (amount <= 0) return 'Bet amount must be positive';
  if (amount > player.balance) return 'Insufficient balance';

  const isComingOut = state.point === null;

  switch (betType) {
    case 'pass': case 'dontPass':
      if (!isComingOut) return `${betType === 'pass' ? 'Pass' : "Don't Pass"} bets can only be placed on the come-out roll`;
      break;
    case 'come': case 'dontCome':
      if (isComingOut) return `${betType === 'come' ? 'Come' : "Don't Come"} bets can only be placed during the point phase`;
      break;
    case 'passOdds': {
      if (isComingOut) return 'Pass odds require an established point';
      const passBet = state.bets.find((b) => b.playerId === playerId && b.type === 'pass');
      if (!passBet) return 'Must have a Pass bet to place odds';
      const existingOdds = state.bets.filter((b) => b.playerId === playerId && b.type === 'passOdds').reduce((sum, b) => sum + b.amount, 0);
      const maxOdds = getMaxOdds(state.point!, passBet.amount);
      if (existingOdds + amount > maxOdds) return `Pass odds cannot exceed $${maxOdds}`;
      if ((state.point === 5 || state.point === 9) && amount % 2 !== 0) return 'Pass odds for 5/9 must be even amounts';
      if ((state.point === 6 || state.point === 8) && amount % 5 !== 0) return 'Pass odds for 6/8 must be multiples of $5';
      break;
    }
    case 'dontPassOdds': {
      if (isComingOut) return "Don't Pass odds require an established point";
      const dpBet = state.bets.find((b) => b.playerId === playerId && b.type === 'dontPass');
      if (!dpBet) return "Must have a Don't Pass bet to lay odds";
      const existingDpOdds = state.bets.filter((b) => b.playerId === playerId && b.type === 'dontPassOdds').reduce((sum, b) => sum + b.amount, 0);
      const maxDpOdds = getMaxDontOdds(state.point!, dpBet.amount);
      if (existingDpOdds + amount > maxDpOdds) return `Don't Pass odds cannot exceed $${maxDpOdds}`;
      if ((state.point === 4 || state.point === 10) && amount % 2 !== 0) return 'Lay odds for 4/10 must be even amounts';
      if ((state.point === 5 || state.point === 9) && amount % 3 !== 0) return 'Lay odds for 5/9 must be multiples of $3';
      if ((state.point === 6 || state.point === 8) && amount % 6 !== 0) return 'Lay odds for 6/8 must be multiples of $6';
      break;
    }
    case 'comeOdds': {
      if (isComingOut) return 'Come odds require the point phase';
      if (!betPoint) return 'Must specify which Come bet point to back';
      const comeBet = state.bets.find((b) => b.playerId === playerId && b.type === 'come' && b.point === betPoint);
      if (!comeBet) return `No Come bet on ${betPoint}`;
      const existingComeOdds = state.bets.filter((b) => b.playerId === playerId && b.type === 'comeOdds' && b.point === betPoint).reduce((sum, b) => sum + b.amount, 0);
      const maxComeOdds = getMaxOdds(betPoint, comeBet.amount);
      if (existingComeOdds + amount > maxComeOdds) return `Come odds on ${betPoint} cannot exceed $${maxComeOdds}`;
      if ((betPoint === 5 || betPoint === 9) && amount % 2 !== 0) return 'Come odds for 5/9 must be even amounts';
      if ((betPoint === 6 || betPoint === 8) && amount % 5 !== 0) return 'Come odds for 6/8 must be multiples of $5';
      break;
    }
    case 'dontComeOdds': {
      if (isComingOut) return "Don't Come odds require the point phase";
      if (!betPoint) return "Must specify which Don't Come bet point to back";
      const dcBet = state.bets.find((b) => b.playerId === playerId && b.type === 'dontCome' && b.point === betPoint);
      if (!dcBet) return `No Don't Come bet on ${betPoint}`;
      const existingDcOdds = state.bets.filter((b) => b.playerId === playerId && b.type === 'dontComeOdds' && b.point === betPoint).reduce((sum, b) => sum + b.amount, 0);
      const maxDcOdds = getMaxDontOdds(betPoint, dcBet.amount);
      if (existingDcOdds + amount > maxDcOdds) return `Don't Come odds on ${betPoint} cannot exceed $${maxDcOdds}`;
      if ((betPoint === 4 || betPoint === 10) && amount % 2 !== 0) return 'Lay odds for 4/10 must be even amounts';
      if ((betPoint === 5 || betPoint === 9) && amount % 3 !== 0) return 'Lay odds for 5/9 must be multiples of $3';
      if ((betPoint === 6 || betPoint === 8) && amount % 6 !== 0) return 'Lay odds for 6/8 must be multiples of $6';
      break;
    }
    case 'place6': case 'place8':
      if (amount % 6 !== 0) return 'Place 6/8 bets must be multiples of $6';
      break;
    case 'place4': case 'place5': case 'place9': case 'place10':
      if (amount % 5 !== 0) return 'Place 4/5/9/10 bets must be multiples of $5';
      break;
    case 'horn':
      if (amount % 4 !== 0) return 'Horn bets must be multiples of $4';
      break;
    case 'field':
    case 'anyCraps': case 'anySeven': case 'yo':
    case 'hard4': case 'hard6': case 'hard8': case 'hard10':
      break;
  }

  return null;
}

// ── Contract Bets ──

export function isContractBet(bet: Bet, point: number | null): boolean {
  if (point === null) return false;
  if (bet.type === 'pass') return true;
  if (bet.type === 'come' && bet.point) return true;
  return false;
}

// ── Helpers ──

export function isPlaceBet(type: BetType): boolean {
  return type === 'place4' || type === 'place5' || type === 'place6' || type === 'place8' || type === 'place9' || type === 'place10';
}

function getPlaceNumber(type: BetType): number {
  const map: Partial<Record<BetType, number>> = { place4: 4, place5: 5, place6: 6, place8: 8, place9: 9, place10: 10 };
  return map[type] ?? 0;
}

function calculatePlacePayout(type: BetType, amount: number): number {
  switch (type) {
    case 'place4': case 'place10': return Math.floor(amount * 9 / 5);
    case 'place5': case 'place9': return Math.floor(amount * 7 / 5);
    case 'place6': case 'place8': return Math.floor(amount * 7 / 6);
    default: return amount;
  }
}

function getHardwayNumber(type: BetType): number {
  const map: Partial<Record<BetType, number>> = { hard4: 4, hard6: 6, hard8: 8, hard10: 10 };
  return map[type] ?? 0;
}

/** Establish come bet points for unresolved come/don't come bets */
export function establishComeBetPoints(bets: Bet[], total: number, resolvedBetIds: Set<string>): Bet[] {
  return bets.map((bet) => {
    if (resolvedBetIds.has(bet.id)) return bet;
    if ((bet.type === 'come' || bet.type === 'dontCome') && !bet.point) {
      if ([4, 5, 6, 8, 9, 10].includes(total)) {
        return { ...bet, point: total };
      }
    }
    return bet;
  });
}

// ── Chip Amount Snapping ──

/** Snap a chip amount to the required multiple for a bet type */
export function snapBetAmount(amount: number, betType: BetType, point: number | null, betPoint?: number): number {
  switch (betType) {
    case 'place6': case 'place8':
      return Math.max(6, Math.ceil(amount / 6) * 6);
    case 'place4': case 'place5': case 'place9': case 'place10':
      return Math.max(5, Math.ceil(amount / 5) * 5);
    case 'horn':
      return Math.max(4, Math.ceil(amount / 4) * 4);
    case 'dontPassOdds': {
      const p = point;
      if (p === 4 || p === 10) return Math.max(2, Math.ceil(amount / 2) * 2);
      if (p === 5 || p === 9) return Math.max(3, Math.ceil(amount / 3) * 3);
      if (p === 6 || p === 8) return Math.max(6, Math.ceil(amount / 6) * 6);
      return amount;
    }
    case 'passOdds': {
      const p = point;
      if (p === 5 || p === 9) return Math.max(2, Math.ceil(amount / 2) * 2);
      if (p === 6 || p === 8) return Math.max(5, Math.ceil(amount / 5) * 5);
      return amount;
    }
    case 'comeOdds': {
      const bp = betPoint;
      if (bp === 5 || bp === 9) return Math.max(2, Math.ceil(amount / 2) * 2);
      if (bp === 6 || bp === 8) return Math.max(5, Math.ceil(amount / 5) * 5);
      return amount;
    }
    case 'dontComeOdds': {
      const bp = betPoint;
      if (bp === 4 || bp === 10) return Math.max(2, Math.ceil(amount / 2) * 2);
      if (bp === 5 || bp === 9) return Math.max(3, Math.ceil(amount / 3) * 3);
      if (bp === 6 || bp === 8) return Math.max(6, Math.ceil(amount / 6) * 6);
      return amount;
    }
    default:
      return amount;
  }
}

// ── Bet Aggregation ──

export interface AggregatedBet {
  key: string;
  type: BetType;
  point?: number;
  total: number;
  count: number;
  removableId: string | null;
}

/** Group bets by type+point, track total and the last removable bet id */
export function aggregateBets(bets: Bet[], point: number | null, trackRemovable: boolean = false): AggregatedBet[] {
  const map = new Map<string, AggregatedBet>();
  for (const bet of bets) {
    const key = bet.point ? `${bet.type}:${bet.point}` : bet.type;
    const existing = map.get(key);
    const canRemove = trackRemovable && !isContractBet(bet, point);
    if (existing) {
      existing.total += bet.amount;
      existing.count++;
      if (canRemove) existing.removableId = bet.id;
    } else {
      map.set(key, { key, type: bet.type, point: bet.point, total: bet.amount, count: 1, removableId: canRemove ? bet.id : null });
    }
  }
  return [...map.values()];
}
