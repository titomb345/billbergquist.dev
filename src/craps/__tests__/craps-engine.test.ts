import { describe, it, expect } from 'vitest';
import {
  rollDice,
  resolveComeOutRoll,
  resolvePointPhaseRoll,
  calculatePayout,
  validateBet,
  isContractBet,
  getMaxOdds,
  getMaxDontOdds,
  establishComeBetPoints,
} from '../engine';
import type { Bet, CrapsGameState, DiceRoll } from '../types';

function makeBet(overrides: Partial<Bet> & { type: Bet['type'] }): Bet {
  return {
    id: overrides.id ?? 'bet-1',
    playerId: overrides.playerId ?? 'player-1',
    amount: overrides.amount ?? 10,
    ...overrides,
  };
}

function makeState(overrides: Partial<CrapsGameState> = {}): CrapsGameState {
  return {
    roomCode: 'TEST',
    hostId: 'player-1',
    phase: 'betting',
    players: [
      { id: 'player-1', name: 'Alice', userId: 'u1', isHost: true, connected: true, balance: 1000, ready: true, avatarUrl: null, betsConfirmed: false },
    ],
    shooterIndex: 0,
    point: null,
    bets: [],
    rollHistory: [],
    createdAt: Date.now(),
    ...overrides,
  };
}

function roll(die1: number, die2: number): DiceRoll {
  return { die1, die2, total: die1 + die2 };
}

describe('rollDice', () => {
  it('returns values between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      const r = rollDice();
      expect(r.die1).toBeGreaterThanOrEqual(1);
      expect(r.die1).toBeLessThanOrEqual(6);
      expect(r.die2).toBeGreaterThanOrEqual(1);
      expect(r.die2).toBeLessThanOrEqual(6);
      expect(r.total).toBe(r.die1 + r.die2);
    }
  });
});

describe('resolveComeOutRoll', () => {
  it('natural 7: pass wins, dont pass loses', () => {
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'dontPass', id: 'dp1' })];
    const { resolutions, newPoint } = resolveComeOutRoll(bets, roll(3, 4));
    expect(newPoint).toBeNull();
    expect(resolutions.find((r) => r.betId === 'p1')!.payout).toBe(10);
    expect(resolutions.find((r) => r.betId === 'dp1')!.payout).toBe(-10);
  });

  it('natural 11: pass wins, dont pass loses', () => {
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'dontPass', id: 'dp1' })];
    const { resolutions, newPoint } = resolveComeOutRoll(bets, roll(5, 6));
    expect(newPoint).toBeNull();
    expect(resolutions.find((r) => r.betId === 'p1')!.payout).toBe(10);
    expect(resolutions.find((r) => r.betId === 'dp1')!.payout).toBe(-10);
  });

  it('craps 2: pass loses, dont pass wins', () => {
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'dontPass', id: 'dp1' })];
    const { resolutions, newPoint } = resolveComeOutRoll(bets, roll(1, 1));
    expect(newPoint).toBeNull();
    expect(resolutions.find((r) => r.betId === 'p1')!.payout).toBe(-10);
    expect(resolutions.find((r) => r.betId === 'dp1')!.payout).toBe(10);
  });

  it('craps 3: pass loses, dont pass wins', () => {
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'dontPass', id: 'dp1' })];
    const { resolutions, newPoint } = resolveComeOutRoll(bets, roll(1, 2));
    expect(newPoint).toBeNull();
    expect(resolutions.find((r) => r.betId === 'p1')!.payout).toBe(-10);
    expect(resolutions.find((r) => r.betId === 'dp1')!.payout).toBe(10);
  });

  it('craps 12: pass loses, dont pass pushes (bar 12)', () => {
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'dontPass', id: 'dp1' })];
    const { resolutions, newPoint } = resolveComeOutRoll(bets, roll(6, 6));
    expect(newPoint).toBeNull();
    expect(resolutions.find((r) => r.betId === 'p1')!.payout).toBe(-10);
    expect(resolutions.find((r) => r.betId === 'dp1')!.payout).toBe(0);
  });

  it('establishes point on 4, 5, 6, 8, 9, 10', () => {
    for (const [d1, d2, expected] of [[2, 2, 4], [2, 3, 5], [3, 3, 6], [4, 4, 8], [4, 5, 9], [5, 5, 10]] as const) {
      const bets = [makeBet({ type: 'pass', id: 'p1' })];
      const { resolutions, newPoint } = resolveComeOutRoll(bets, roll(d1, d2));
      expect(newPoint).toBe(expected);
      // Pass bet is not resolved on point establishment
      expect(resolutions.filter((r) => r.betType === 'pass')).toHaveLength(0);
    }
  });

  it('resolves field bets on come-out', () => {
    const bets = [makeBet({ type: 'field', id: 'f1', amount: 10 })];
    // Field wins on 2 (2:1)
    const { resolutions: r2 } = resolveComeOutRoll(bets, roll(1, 1));
    expect(r2.find((r) => r.betId === 'f1')!.payout).toBe(20);

    // Field wins on 12 (3:1)
    const { resolutions: r12 } = resolveComeOutRoll(bets, roll(6, 6));
    expect(r12.find((r) => r.betId === 'f1')!.payout).toBe(30);

    // Field wins on 3 (1:1)
    const { resolutions: r3 } = resolveComeOutRoll(bets, roll(1, 2));
    expect(r3.find((r) => r.betId === 'f1')!.payout).toBe(10);

    // Field loses on 7
    const { resolutions: r7 } = resolveComeOutRoll(bets, roll(3, 4));
    expect(r7.find((r) => r.betId === 'f1')!.payout).toBe(-10);
  });

  it('resolves one-roll bets on come-out', () => {
    const bets = [
      makeBet({ type: 'anyCraps', id: 'ac1', amount: 5 }),
      makeBet({ type: 'anySeven', id: 'as1', amount: 5 }),
      makeBet({ type: 'yo', id: 'y1', amount: 5 }),
    ];

    // Roll 7: anySeven wins, others lose
    const { resolutions: r7 } = resolveComeOutRoll(bets, roll(3, 4));
    expect(r7.find((r) => r.betId === 'as1')!.payout).toBe(20); // 4:1
    expect(r7.find((r) => r.betId === 'ac1')!.payout).toBe(-5);
    expect(r7.find((r) => r.betId === 'y1')!.payout).toBe(-5);

    // Roll 11: yo wins
    const { resolutions: r11 } = resolveComeOutRoll(bets, roll(5, 6));
    expect(r11.find((r) => r.betId === 'y1')!.payout).toBe(75); // 15:1

    // Roll 2: any craps wins
    const { resolutions: r2 } = resolveComeOutRoll(bets, roll(1, 1));
    expect(r2.find((r) => r.betId === 'ac1')!.payout).toBe(35); // 7:1
  });

  it('resolves horn bet on come-out', () => {
    const bets = [makeBet({ type: 'horn', id: 'h1', amount: 4 })];

    // Roll 2: pays 27:4
    const { resolutions: r2 } = resolveComeOutRoll(bets, roll(1, 1));
    expect(r2.find((r) => r.betId === 'h1')!.payout).toBe(27);

    // Roll 12: pays 27:4
    const { resolutions: r12 } = resolveComeOutRoll(bets, roll(6, 6));
    expect(r12.find((r) => r.betId === 'h1')!.payout).toBe(27);

    // Roll 3: pays 3:1
    const { resolutions: r3 } = resolveComeOutRoll(bets, roll(1, 2));
    expect(r3.find((r) => r.betId === 'h1')!.payout).toBe(12);

    // Roll 11: pays 3:1
    const { resolutions: r11 } = resolveComeOutRoll(bets, roll(5, 6));
    expect(r11.find((r) => r.betId === 'h1')!.payout).toBe(12);

    // Roll 7: loses
    const { resolutions: r7 } = resolveComeOutRoll(bets, roll(3, 4));
    expect(r7.find((r) => r.betId === 'h1')!.payout).toBe(-4);
  });
});

describe('resolvePointPhaseRoll', () => {
  it('point made: pass wins, dont pass loses', () => {
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'dontPass', id: 'dp1' })];
    const { resolutions, pointMade, sevenOut } = resolvePointPhaseRoll(bets, roll(3, 3), 6);
    expect(pointMade).toBe(true);
    expect(sevenOut).toBe(false);
    expect(resolutions.find((r) => r.betId === 'p1')!.payout).toBe(10);
    expect(resolutions.find((r) => r.betId === 'dp1')!.payout).toBe(-10);
  });

  it('seven-out: pass loses, dont pass wins', () => {
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'dontPass', id: 'dp1' })];
    const { resolutions, pointMade, sevenOut } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(pointMade).toBe(false);
    expect(sevenOut).toBe(true);
    expect(resolutions.find((r) => r.betId === 'p1')!.payout).toBe(-10);
    expect(resolutions.find((r) => r.betId === 'dp1')!.payout).toBe(10);
  });

  it('pass odds pay true odds on point made', () => {
    // Point 4: 2:1 odds
    const bets = [makeBet({ type: 'pass', id: 'p1' }), makeBet({ type: 'passOdds', id: 'po1', amount: 30 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(2, 2), 4);
    expect(resolutions.find((r) => r.betId === 'po1')!.payout).toBe(60);
  });

  it('pass odds on 5/9 pay 3:2', () => {
    const bets = [makeBet({ type: 'passOdds', id: 'po1', amount: 20 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(4, 5), 9);
    expect(resolutions.find((r) => r.betId === 'po1')!.payout).toBe(30);
  });

  it('pass odds on 6/8 pay 6:5', () => {
    const bets = [makeBet({ type: 'passOdds', id: 'po1', amount: 25 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(2, 4), 6);
    expect(resolutions.find((r) => r.betId === 'po1')!.payout).toBe(30);
  });

  // Don't Pass Odds
  it('dont pass odds win on seven-out (point 4: 1:2)', () => {
    const bets = [makeBet({ type: 'dontPass', id: 'dp1' }), makeBet({ type: 'dontPassOdds', id: 'dpo1', amount: 60 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 4);
    expect(resolutions.find((r) => r.betId === 'dpo1')!.payout).toBe(30); // 60 * 1/2
  });

  it('dont pass odds win on seven-out (point 5: 2:3)', () => {
    const bets = [makeBet({ type: 'dontPassOdds', id: 'dpo1', amount: 60 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 5);
    expect(resolutions.find((r) => r.betId === 'dpo1')!.payout).toBe(40); // 60 * 2/3
  });

  it('dont pass odds win on seven-out (point 6: 5:6)', () => {
    const bets = [makeBet({ type: 'dontPassOdds', id: 'dpo1', amount: 60 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'dpo1')!.payout).toBe(50); // 60 * 5/6
  });

  it('dont pass odds lose on point made', () => {
    const bets = [makeBet({ type: 'dontPassOdds', id: 'dpo1', amount: 60 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(2, 2), 4);
    expect(resolutions.find((r) => r.betId === 'dpo1')!.payout).toBe(-60);
  });

  // Don't Come Odds
  it('dont come odds win on seven-out', () => {
    const bets = [
      makeBet({ type: 'dontCome', id: 'dc1', point: 8 }),
      makeBet({ type: 'dontComeOdds', id: 'dco1', amount: 30, point: 8 }),
    ];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    // Point 8: 5:6 payout → 30 * 5/6 = 25
    expect(resolutions.find((r) => r.betId === 'dco1')!.payout).toBe(25);
  });

  it('dont come odds lose when their point is hit', () => {
    const bets = [
      makeBet({ type: 'dontCome', id: 'dc1', point: 8 }),
      makeBet({ type: 'dontComeOdds', id: 'dco1', amount: 30, point: 8 }),
    ];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 5), 6);
    expect(resolutions.find((r) => r.betId === 'dco1')!.payout).toBe(-30);
  });

  it('come bet with point wins when point hit', () => {
    const bets = [makeBet({ type: 'come', id: 'c1', point: 8 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 5), 6);
    expect(resolutions.find((r) => r.betId === 'c1')!.payout).toBe(10);
  });

  it('come bet without point wins on 7 during point phase', () => {
    const bets = [makeBet({ type: 'come', id: 'c1' })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'c1')!.payout).toBe(10);
  });

  it('come bet with point loses on 7', () => {
    const bets = [makeBet({ type: 'come', id: 'c1', point: 8 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'c1')!.payout).toBe(-10);
  });

  it('dont come with point wins on 7', () => {
    const bets = [makeBet({ type: 'dontCome', id: 'dc1', point: 8 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'dc1')!.payout).toBe(10);
  });

  it('place 6 pays 7:6', () => {
    const bets = [makeBet({ type: 'place6', id: 'pl6', amount: 12 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(2, 4), 8);
    expect(resolutions.find((r) => r.betId === 'pl6')!.payout).toBe(14);
  });

  it('place 8 pays 7:6', () => {
    const bets = [makeBet({ type: 'place8', id: 'pl8', amount: 18 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 5), 6);
    expect(resolutions.find((r) => r.betId === 'pl8')!.payout).toBe(21);
  });

  it('place bets lose on seven-out', () => {
    const bets = [makeBet({ type: 'place6', id: 'pl6', amount: 12 }), makeBet({ type: 'place8', id: 'pl8', amount: 18 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'pl6')!.payout).toBe(-12);
    expect(resolutions.find((r) => r.betId === 'pl8')!.payout).toBe(-18);
  });

  it('come bet without point: 11 wins, 2/3/12 loses', () => {
    const bets = [makeBet({ type: 'come', id: 'c1' })];

    const { resolutions: r11 } = resolvePointPhaseRoll(bets, roll(5, 6), 4);
    expect(r11.find((r) => r.betId === 'c1')!.payout).toBe(10);

    const { resolutions: r2 } = resolvePointPhaseRoll(bets, roll(1, 1), 4);
    expect(r2.find((r) => r.betId === 'c1')!.payout).toBe(-10);

    const { resolutions: r3 } = resolvePointPhaseRoll(bets, roll(1, 2), 4);
    expect(r3.find((r) => r.betId === 'c1')!.payout).toBe(-10);
  });

  it('dont come without point: 2/3 wins, 11 loses, 12 pushes', () => {
    const bets = [makeBet({ type: 'dontCome', id: 'dc1' })];

    const { resolutions: r2 } = resolvePointPhaseRoll(bets, roll(1, 1), 4);
    expect(r2.find((r) => r.betId === 'dc1')!.payout).toBe(10);

    const { resolutions: r11 } = resolvePointPhaseRoll(bets, roll(5, 6), 4);
    expect(r11.find((r) => r.betId === 'dc1')!.payout).toBe(-10);

    const { resolutions: r12 } = resolvePointPhaseRoll(bets, roll(6, 6), 4);
    expect(r12.find((r) => r.betId === 'dc1')!.payout).toBe(0);
  });

  it('field bets resolve every roll during point phase', () => {
    const bets = [makeBet({ type: 'field', id: 'f1', amount: 10 })];
    // 9 wins (1:1)
    const { resolutions: r9 } = resolvePointPhaseRoll(bets, roll(4, 5), 6);
    expect(r9.find((r) => r.betId === 'f1')!.payout).toBe(10);
    // 8 loses
    const { resolutions: r8 } = resolvePointPhaseRoll(bets, roll(3, 5), 6);
    expect(r8.find((r) => r.betId === 'f1')!.payout).toBe(-10);
  });

  // Hardway bets
  it('hard 4 wins on 2+2 (7:1)', () => {
    const bets = [makeBet({ type: 'hard4', id: 'h4', amount: 5 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(2, 2), 6);
    expect(resolutions.find((r) => r.betId === 'h4')!.payout).toBe(35);
  });

  it('hard 4 loses on easy 4 (1+3)', () => {
    const bets = [makeBet({ type: 'hard4', id: 'h4', amount: 5 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(1, 3), 6);
    expect(resolutions.find((r) => r.betId === 'h4')!.payout).toBe(-5);
  });

  it('hard 6 wins on 3+3 (9:1)', () => {
    const bets = [makeBet({ type: 'hard6', id: 'h6', amount: 5 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 3), 8);
    expect(resolutions.find((r) => r.betId === 'h6')!.payout).toBe(45);
  });

  it('hard 6 loses on easy 6 (2+4)', () => {
    const bets = [makeBet({ type: 'hard6', id: 'h6', amount: 5 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(2, 4), 8);
    expect(resolutions.find((r) => r.betId === 'h6')!.payout).toBe(-5);
  });

  it('hard 8 wins on 4+4 (9:1)', () => {
    const bets = [makeBet({ type: 'hard8', id: 'h8', amount: 10 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(4, 4), 6);
    expect(resolutions.find((r) => r.betId === 'h8')!.payout).toBe(90);
  });

  it('hard 10 wins on 5+5 (7:1)', () => {
    const bets = [makeBet({ type: 'hard10', id: 'h10', amount: 10 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(5, 5), 6);
    expect(resolutions.find((r) => r.betId === 'h10')!.payout).toBe(70);
  });

  it('hardway bets lose on 7', () => {
    const bets = [
      makeBet({ type: 'hard4', id: 'h4', amount: 5 }),
      makeBet({ type: 'hard6', id: 'h6', amount: 5 }),
      makeBet({ type: 'hard8', id: 'h8', amount: 5 }),
      makeBet({ type: 'hard10', id: 'h10', amount: 5 }),
    ];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'h4')!.payout).toBe(-5);
    expect(resolutions.find((r) => r.betId === 'h6')!.payout).toBe(-5);
    expect(resolutions.find((r) => r.betId === 'h8')!.payout).toBe(-5);
    expect(resolutions.find((r) => r.betId === 'h10')!.payout).toBe(-5);
  });

  it('hardway bets stay on unrelated numbers', () => {
    const bets = [makeBet({ type: 'hard4', id: 'h4', amount: 5 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(4, 5), 6);
    // 9 rolled, not 4 or 7 - hardway bet should not be resolved
    const hardRes = resolutions.filter((r) => r.betId === 'h4');
    expect(hardRes).toHaveLength(0);
  });

  // One-roll bets during point phase
  it('any craps wins on 2, 3, 12 during point phase', () => {
    const bets = [makeBet({ type: 'anyCraps', id: 'ac1', amount: 5 })];

    const { resolutions: r2 } = resolvePointPhaseRoll(bets, roll(1, 1), 6);
    expect(r2.find((r) => r.betId === 'ac1')!.payout).toBe(35);

    const { resolutions: r3 } = resolvePointPhaseRoll(bets, roll(1, 2), 6);
    expect(r3.find((r) => r.betId === 'ac1')!.payout).toBe(35);

    const { resolutions: r12 } = resolvePointPhaseRoll(bets, roll(6, 6), 6);
    expect(r12.find((r) => r.betId === 'ac1')!.payout).toBe(35);
  });

  it('any seven wins on 7 during point phase', () => {
    const bets = [makeBet({ type: 'anySeven', id: 'as1', amount: 5 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'as1')!.payout).toBe(20);
  });

  it('yo wins on 11 during point phase', () => {
    const bets = [makeBet({ type: 'yo', id: 'y1', amount: 5 })];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(5, 6), 4);
    expect(resolutions.find((r) => r.betId === 'y1')!.payout).toBe(75);
  });

  it('horn bet resolves during point phase', () => {
    const bets = [makeBet({ type: 'horn', id: 'h1', amount: 8 })];

    // Roll 2: 27:4
    const { resolutions: r2 } = resolvePointPhaseRoll(bets, roll(1, 1), 6);
    expect(r2.find((r) => r.betId === 'h1')!.payout).toBe(54); // 27 * 8 / 4

    // Roll 3: 3:1
    const { resolutions: r3 } = resolvePointPhaseRoll(bets, roll(1, 2), 6);
    expect(r3.find((r) => r.betId === 'h1')!.payout).toBe(24); // 3 * 8

    // Roll 5: loses
    const { resolutions: r5 } = resolvePointPhaseRoll(bets, roll(2, 3), 6);
    expect(r5.find((r) => r.betId === 'h1')!.payout).toBe(-8);
  });

  // Come odds
  it('come odds win when come point is hit', () => {
    const bets = [
      makeBet({ type: 'come', id: 'c1', point: 8 }),
      makeBet({ type: 'comeOdds', id: 'co1', amount: 25, point: 8 }),
    ];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 5), 6);
    // Point 8: 6:5 odds → 25 * 6/5 = 30
    expect(resolutions.find((r) => r.betId === 'co1')!.payout).toBe(30);
  });

  it('come odds lose on seven-out', () => {
    const bets = [
      makeBet({ type: 'comeOdds', id: 'co1', amount: 25, point: 8 }),
    ];
    const { resolutions } = resolvePointPhaseRoll(bets, roll(3, 4), 6);
    expect(resolutions.find((r) => r.betId === 'co1')!.payout).toBe(-25);
  });
});

describe('calculatePayout', () => {
  it('pass/dontPass pay 1:1', () => {
    expect(calculatePayout('pass', 10, null)).toBe(10);
    expect(calculatePayout('dontPass', 10, null)).toBe(10);
  });

  it('place 6/8 pay 7:6', () => {
    expect(calculatePayout('place6', 12, null)).toBe(14);
    expect(calculatePayout('place8', 6, null)).toBe(7);
  });

  it('pass odds pay true odds', () => {
    expect(calculatePayout('passOdds', 10, 4)).toBe(20);
    expect(calculatePayout('passOdds', 10, 5)).toBe(15);
    expect(calculatePayout('passOdds', 10, 6)).toBe(12);
  });

  it('dont pass odds pay lay odds', () => {
    expect(calculatePayout('dontPassOdds', 10, 4)).toBe(5);  // 1:2
    expect(calculatePayout('dontPassOdds', 9, 5)).toBe(6);   // 2:3
    expect(calculatePayout('dontPassOdds', 6, 6)).toBe(5);   // 5:6
  });

  it('hardway payouts', () => {
    expect(calculatePayout('hard4', 5, null)).toBe(35);
    expect(calculatePayout('hard10', 5, null)).toBe(35);
    expect(calculatePayout('hard6', 5, null)).toBe(45);
    expect(calculatePayout('hard8', 5, null)).toBe(45);
  });

  it('proposition bet payouts', () => {
    expect(calculatePayout('anyCraps', 5, null)).toBe(35);
    expect(calculatePayout('anySeven', 5, null)).toBe(20);
    expect(calculatePayout('yo', 5, null)).toBe(75);
    expect(calculatePayout('horn', 4, null)).toBe(27);
  });
});

describe('validateBet', () => {
  it('rejects pass bet during point phase', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'pass', 10)).toContain('come-out roll');
  });

  it('allows pass bet on come-out', () => {
    const state = makeState({ point: null });
    expect(validateBet(state, 'player-1', 'pass', 10)).toBeNull();
  });

  it('rejects come bet on come-out', () => {
    const state = makeState({ point: null });
    expect(validateBet(state, 'player-1', 'come', 10)).toContain('point phase');
  });

  it('allows come bet during point phase', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'come', 10)).toBeNull();
  });

  it('rejects insufficient balance', () => {
    const state = makeState();
    state.players[0].balance = 5;
    expect(validateBet(state, 'player-1', 'pass', 10)).toContain('Insufficient');
  });

  it('rejects place 6/8 not multiple of 6', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'place6', 10)).toContain('multiples of $6');
  });

  it('allows place 6/8 multiple of 6', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'place6', 12)).toBeNull();
  });

  it('rejects pass odds without pass bet', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'passOdds', 10)).toContain('Must have a Pass bet');
  });

  it('enforces max odds (3x-4x-5x)', () => {
    const state = makeState({
      point: 4,
      bets: [
        makeBet({ type: 'pass', id: 'p1', amount: 10 }),
        makeBet({ type: 'passOdds', id: 'po1', amount: 20 }),
      ],
    });
    // Max odds for point 4 = 3x = $30, already have $20
    expect(validateBet(state, 'player-1', 'passOdds', 15)).toContain('cannot exceed');
    expect(validateBet(state, 'player-1', 'passOdds', 10)).toBeNull();
  });

  // Pass odds multiples validation
  it('rejects pass odds for 5/9 that are not even', () => {
    const state = makeState({
      point: 5,
      bets: [makeBet({ type: 'pass', id: 'p1', amount: 10 })],
    });
    expect(validateBet(state, 'player-1', 'passOdds', 5)).toContain('even amounts');
  });

  it('rejects pass odds for 6/8 that are not multiples of 5', () => {
    const state = makeState({
      point: 6,
      bets: [makeBet({ type: 'pass', id: 'p1', amount: 10 })],
    });
    expect(validateBet(state, 'player-1', 'passOdds', 3)).toContain('multiples of $5');
  });

  // Don't Pass Odds validation
  it('rejects dont pass odds without dont pass bet', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'dontPassOdds', 10)).toContain("Must have a Don't Pass bet");
  });

  it('allows dont pass odds with dont pass bet', () => {
    const state = makeState({
      point: 4,
      bets: [makeBet({ type: 'dontPass', id: 'dp1', amount: 10 })],
    });
    expect(validateBet(state, 'player-1', 'dontPassOdds', 10)).toBeNull();
  });

  it('enforces max dont pass odds (6x flat)', () => {
    const state = makeState({
      point: 4,
      bets: [
        makeBet({ type: 'dontPass', id: 'dp1', amount: 10 }),
        makeBet({ type: 'dontPassOdds', id: 'dpo1', amount: 50 }),
      ],
    });
    // Max = 6x10 = 60, already have 50
    expect(validateBet(state, 'player-1', 'dontPassOdds', 20)).toContain('cannot exceed');
    expect(validateBet(state, 'player-1', 'dontPassOdds', 10)).toBeNull();
  });

  it('rejects lay odds for 5/9 not multiple of 3', () => {
    const state = makeState({
      point: 5,
      bets: [makeBet({ type: 'dontPass', id: 'dp1', amount: 10 })],
    });
    expect(validateBet(state, 'player-1', 'dontPassOdds', 5)).toContain('multiples of $3');
  });

  it('rejects lay odds for 6/8 not multiple of 6', () => {
    const state = makeState({
      point: 6,
      bets: [makeBet({ type: 'dontPass', id: 'dp1', amount: 10 })],
    });
    expect(validateBet(state, 'player-1', 'dontPassOdds', 5)).toContain('multiples of $6');
  });

  // Come Odds validation
  it('rejects come odds without specifying point', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'comeOdds', 10)).toContain('Must specify');
  });

  it('rejects come odds without matching come bet', () => {
    const state = makeState({ point: 6 });
    expect(validateBet(state, 'player-1', 'comeOdds', 10, 8)).toContain('No Come bet');
  });

  it('allows come odds with matching come bet', () => {
    const state = makeState({
      point: 6,
      bets: [makeBet({ type: 'come', id: 'c1', point: 8 })],
    });
    expect(validateBet(state, 'player-1', 'comeOdds', 10, 8)).toBeNull();
  });

  // Horn validation
  it('rejects horn bet not multiple of 4', () => {
    const state = makeState();
    expect(validateBet(state, 'player-1', 'horn', 5)).toContain('multiples of $4');
  });

  it('allows horn bet multiple of 4', () => {
    const state = makeState();
    expect(validateBet(state, 'player-1', 'horn', 8)).toBeNull();
  });

  // Proposition bets always allowed
  it('allows proposition bets', () => {
    const state = makeState();
    expect(validateBet(state, 'player-1', 'anyCraps', 5)).toBeNull();
    expect(validateBet(state, 'player-1', 'anySeven', 5)).toBeNull();
    expect(validateBet(state, 'player-1', 'yo', 5)).toBeNull();
  });

  // Hardway bets always allowed
  it('allows hardway bets', () => {
    const state = makeState();
    expect(validateBet(state, 'player-1', 'hard4', 5)).toBeNull();
    expect(validateBet(state, 'player-1', 'hard6', 5)).toBeNull();
    expect(validateBet(state, 'player-1', 'hard8', 5)).toBeNull();
    expect(validateBet(state, 'player-1', 'hard10', 5)).toBeNull();
  });
});

describe('isContractBet', () => {
  it('pass is contract when point established', () => {
    expect(isContractBet(makeBet({ type: 'pass' }), 6)).toBe(true);
  });

  it('pass is not contract on come-out', () => {
    expect(isContractBet(makeBet({ type: 'pass' }), null)).toBe(false);
  });

  it('come with point is contract', () => {
    expect(isContractBet(makeBet({ type: 'come', point: 8 }), 6)).toBe(true);
  });

  it('come without point is not contract', () => {
    expect(isContractBet(makeBet({ type: 'come' }), 6)).toBe(false);
  });

  it('field is never contract', () => {
    expect(isContractBet(makeBet({ type: 'field' }), 6)).toBe(false);
  });
});

describe('getMaxOdds', () => {
  it('3x for 4/10', () => {
    expect(getMaxOdds(4, 10)).toBe(30);
    expect(getMaxOdds(10, 10)).toBe(30);
  });
  it('4x for 5/9', () => {
    expect(getMaxOdds(5, 10)).toBe(40);
    expect(getMaxOdds(9, 10)).toBe(40);
  });
  it('5x for 6/8', () => {
    expect(getMaxOdds(6, 10)).toBe(50);
    expect(getMaxOdds(8, 10)).toBe(50);
  });
});

describe('getMaxDontOdds', () => {
  it('6x for all points', () => {
    expect(getMaxDontOdds(4, 10)).toBe(60);
    expect(getMaxDontOdds(5, 10)).toBe(60);
    expect(getMaxDontOdds(6, 10)).toBe(60);
    expect(getMaxDontOdds(8, 10)).toBe(60);
    expect(getMaxDontOdds(9, 10)).toBe(60);
    expect(getMaxDontOdds(10, 10)).toBe(60);
  });
});

describe('establishComeBetPoints', () => {
  it('establishes point for come bets on point numbers', () => {
    const bets = [makeBet({ type: 'come', id: 'c1' })];
    const resolved = new Set<string>();
    const result = establishComeBetPoints(bets, 8, resolved);
    expect(result[0].point).toBe(8);
  });

  it('does not establish point for resolved bets', () => {
    const bets = [makeBet({ type: 'come', id: 'c1' })];
    const resolved = new Set(['c1']);
    const result = establishComeBetPoints(bets, 8, resolved);
    expect(result[0].point).toBeUndefined();
  });

  it('does not establish point for non-point numbers', () => {
    const bets = [makeBet({ type: 'come', id: 'c1' })];
    const resolved = new Set<string>();
    // 7 is not a point number
    const result = establishComeBetPoints(bets, 7, resolved);
    expect(result[0].point).toBeUndefined();
  });
});
