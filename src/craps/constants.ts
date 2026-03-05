import type { BetType } from './types';

export { WORKER_URL, generateRoomCode } from '../shared/constants';
export { STARTING_BALANCE, EMOJI_MAP } from './types';

export const CHIP_DENOMINATIONS = [1, 5, 25, 100] as const;

export const BET_LABELS: Record<BetType, string> = {
  pass: 'Pass Line',
  dontPass: "Don't Pass",
  come: 'Come',
  dontCome: "Don't Come",
  field: 'Field',
  place4: 'Place 4',
  place5: 'Place 5',
  place6: 'Place 6',
  place8: 'Place 8',
  place9: 'Place 9',
  place10: 'Place 10',
  passOdds: 'Pass Odds',
  dontPassOdds: "DP Odds",
  comeOdds: 'Come Odds',
  dontComeOdds: "DC Odds",
  hard4: 'Hard 4',
  hard6: 'Hard 6',
  hard8: 'Hard 8',
  hard10: 'Hard 10',
  anyCraps: 'Any Craps',
  anySeven: 'Any 7',
  yo: 'Yo 11',
  horn: 'Horn',
};

export const PAYOUT_TABLE: { type: BetType; label: string; payout: string; edge: string }[] = [
  { type: 'pass', label: 'Pass Line', payout: '1:1', edge: '1.41%' },
  { type: 'dontPass', label: "Don't Pass", payout: '1:1', edge: '1.36%' },
  { type: 'come', label: 'Come', payout: '1:1', edge: '1.41%' },
  { type: 'dontCome', label: "Don't Come", payout: '1:1', edge: '1.36%' },
  { type: 'field', label: 'Field', payout: '1:1 (2 pays 2:1, 12 pays 3:1)', edge: '2.78%' },
  { type: 'place4', label: 'Place 4', payout: '9:5', edge: '6.67%' },
  { type: 'place5', label: 'Place 5', payout: '7:5', edge: '4.00%' },
  { type: 'place6', label: 'Place 6', payout: '7:6', edge: '1.52%' },
  { type: 'place8', label: 'Place 8', payout: '7:6', edge: '1.52%' },
  { type: 'place9', label: 'Place 9', payout: '7:5', edge: '4.00%' },
  { type: 'place10', label: 'Place 10', payout: '9:5', edge: '6.67%' },
  { type: 'passOdds', label: 'Pass Odds', payout: 'True odds (4/10: 2:1, 5/9: 3:2, 6/8: 6:5)', edge: '0%' },
  { type: 'dontPassOdds', label: "Don't Pass Odds", payout: 'Lay odds (4/10: 1:2, 5/9: 2:3, 6/8: 5:6)', edge: '0%' },
  { type: 'comeOdds', label: 'Come Odds', payout: 'True odds', edge: '0%' },
  { type: 'dontComeOdds', label: "Don't Come Odds", payout: 'Lay odds', edge: '0%' },
  { type: 'hard4', label: 'Hard 4', payout: '7:1', edge: '11.11%' },
  { type: 'hard6', label: 'Hard 6', payout: '9:1', edge: '9.09%' },
  { type: 'hard8', label: 'Hard 8', payout: '9:1', edge: '9.09%' },
  { type: 'hard10', label: 'Hard 10', payout: '7:1', edge: '11.11%' },
  { type: 'anyCraps', label: 'Any Craps', payout: '7:1', edge: '11.11%' },
  { type: 'anySeven', label: 'Any Seven', payout: '4:1', edge: '16.67%' },
  { type: 'yo', label: 'Yo (11)', payout: '15:1', edge: '11.11%' },
  { type: 'horn', label: 'Horn', payout: '27:4 on 2/12, 3:1 on 3/11', edge: '12.50%' },
];

/** Duration of the dice roll animation in ms */
export const DICE_ANIMATION_MS = 1200;
/** Delay after dice animation settles before showing results */
export const POST_ROLL_DELAY_MS = DICE_ANIMATION_MS + 100;
/** Longer delay for effects that should appear after the result text */
export const POST_RESULT_DELAY_MS = DICE_ANIMATION_MS + 400;
