import type { Bet, BetType, CrapsPhase, Player } from '../types';
import { snapBetAmount } from '../engine';
import styles from './CrapsTable.module.css';

interface CrapsTableProps {
  point: number | null;
  bets: Bet[];
  players: Player[];
  myPlayerId: string;
  onPlaceBet: (betType: BetType, amount: number, betPoint?: number) => void;
  phase: CrapsPhase;
  betsConfirmed: boolean;
  selectedChip: number;
}

/** Player rail colors — CSS variable names from the site theme */
const PLAYER_COLOR_VARS = ['--neon-mint', '--neon-peach', '--neon-blue', '--neon-purple'] as const;

let _cached: string[] | null = null;
export function getPlayerColors(): string[] {
  if (!_cached) {
    const style = getComputedStyle(document.documentElement);
    _cached = PLAYER_COLOR_VARS.map((v) => style.getPropertyValue(v).trim());
  }
  return _cached;
}

const CHIP_COLORS: Record<number, { bg: string; text: string }> = {
  1:   { bg: '#e0e0e0', text: '#222' },    // white — dark text
  5:   { bg: '#e05050', text: '#fff' },     // red
  25:  { bg: '#3ba55d', text: '#fff' },     // green
  100: { bg: '#1a1a1a', text: '#fff' },     // black
};

const DENOMINATIONS = [100, 25, 5, 1] as const;

/** Break a dollar amount into the fewest chips possible */
function breakIntoChips(amount: number): number[] {
  const chips: number[] = [];
  let remaining = amount;
  for (const d of DENOMINATIONS) {
    while (remaining >= d && chips.length < 3) {
      chips.push(d);
      remaining -= d;
    }
  }
  return chips;
}

/** Vertical offset per chip in a stack (px) */
const CHIP_STACK_OFFSET = 3;

/**
 * Per-zone chip positions. Each zone gets 4 [x, y] offsets from its
 * chipStack anchor (centered in the zone by default, overridden per
 * zone in CSS). Positions are hand-tuned so chips never cover labels.
 */
type ChipZone = 'dontPass' | 'number' | 'dontCome' | 'come' | 'field' | 'passOdds' | 'pass';

const CHIP_POSITIONS: Record<ChipZone, [number, number][]> = {
  // Full-width ~820px, narrow bar — evenly spaced across the zone
  dontPass: [
    [-340, 0], [-220, 0], [220, 0], [340, 0],
  ],
  // ~143px wide boxes — four corners, spread wider
  number: [
    [-38, -18], [38, -18],
    [-38, 18],  [38, 18],
  ],
  // ~110px wide — four corners
  dontCome: [
    [-36, -24], [36, -24],
    [-36, 24],  [36, 24],
  ],
  // ~710px wide — evenly spaced, clear of center "COME" label
  come: [
    [-300, 0], [-180, 0], [180, 0], [300, 0],
  ],
  // Full-width ~820px — evenly spaced, clear of center labels
  field: [
    [-360, 0], [-240, 0], [240, 0], [360, 0],
  ],
  // Full-width ~820px, narrow
  passOdds: [
    [-320, 0], [-200, 0], [200, 0], [320, 0],
  ],
  // Full-width ~820px, curved bottom
  pass: [
    [-300, 0], [-180, 0], [180, 0], [300, 0],
  ],
};

interface ChipStackProps {
  bets: Bet[];
  players: Player[];
  zone: ChipZone;
}

function ChipStack({ bets, players, zone }: ChipStackProps) {
  if (bets.length === 0) return null;

  // Aggregate bets by player
  const byPlayer = new Map<string, number>();
  for (const bet of bets) {
    byPlayer.set(bet.playerId, (byPlayer.get(bet.playerId) ?? 0) + bet.amount);
  }

  const positions = CHIP_POSITIONS[zone];

  return (
    <div className={styles.chipStack}>
      {[...byPlayer.entries()].map(([playerId, total]) => {
        const globalIdx = players.findIndex((p) => p.id === playerId);
        const colors = getPlayerColors();
        const slotIdx = globalIdx % colors.length;
        const playerColor = colors[slotIdx];
        const playerName = players[globalIdx]?.name ?? 'Player';
        const [x, y] = positions[slotIdx];
        const visualChips = breakIntoChips(total);

        return (
          <div
            key={playerId}
            className={styles.playerSlot}
            style={{
              '--slot-x': `${x}px`,
              '--slot-y': `${y}px`,
              '--player-color': playerColor,
            } as React.CSSProperties}
          >
            {/* Stacked denomination chips, bottom to top */}
            {visualChips.map((denom, i) => {
              const bottomOffset = (visualChips.length - 1 - i) * CHIP_STACK_OFFSET;
              return (
                <div
                  key={`${denom}-${i}`}
                  className={styles.chip}
                  style={{
                    '--chip-color': (CHIP_COLORS[denom]?.bg) ?? playerColor,
                    '--chip-text-color': (CHIP_COLORS[denom]?.text) ?? '#fff',
                    bottom: `${bottomOffset}px`,
                    zIndex: visualChips.length - i,
                  } as React.CSSProperties}
                >
                  {i === 0 && (
                    <span className={styles.chipValue}>${total}</span>
                  )}
                </div>
              );
            })}
            {/* Tooltip on hover */}
            <div className={styles.chipTooltip}>
              <span className={styles.tooltipDot} style={{ background: playerColor }} />
              <span className={styles.tooltipName}>{playerName}</span>
              <span className={styles.tooltipAmount}>${total}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BetIndicatorRow({ bets, players, label, position }: { bets: Bet[]; players: Player[]; label: string; position: 'top' | 'bottom' }) {
  const wrapClass = position === 'bottom' ? styles.comeIndicators : styles.dontComeIndicators;
  const badgeClass = position === 'bottom' ? styles.comeIndicatorBadge : styles.dontComeIndicatorBadge;
  return (
    <div className={wrapClass}>
      <span className={badgeClass}>{label}</span>
      {bets.map((b) => {
        const idx = players.findIndex((p) => p.id === b.playerId);
        const colors = getPlayerColors();
        const color = colors[idx % colors.length];
        return (
          <div key={b.id} className={styles.indicatorDotWrap}>
            <div className={styles.comeIndicatorDot} style={{ background: color }} />
            <div className={styles.chipTooltip}>
              <span className={styles.tooltipDot} style={{ background: color }} />
              <span className={styles.tooltipName}>{players[idx]?.name ?? 'Player'}</span>
              <span className={styles.tooltipAmount}>${b.amount}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PointPuck({ point }: { point: number | null }) {
  return (
    <div className={`${styles.puck} ${point ? styles.puckOn : styles.puckOff}`}>
      {point ? (
        <>
          <span className={styles.puckLabel}>ON</span>
        </>
      ) : (
        <span className={styles.puckLabel}>OFF</span>
      )}
    </div>
  );
}

const NUMBER_DISPLAY: Record<number, string> = {
  4: '4',
  5: '5',
  6: 'SIX',
  8: '8',
  9: 'NINE',
  10: '10',
};

const PLACE_NUMBERS = [4, 5, 6, 8, 9, 10] as const;
const PLACE_BET_MAP: Record<number, BetType> = { 4: 'place4', 5: 'place5', 6: 'place6', 8: 'place8', 9: 'place9', 10: 'place10' };

// ── DEBUG: set to true to preview a fully loaded board ──
const DEBUG_FULL_BOARD = false;

function makeDebugData() {
  const fakePlayers: Player[] = [
    { id: 'p1', name: 'Alice', userId: 'u1', isHost: true, connected: true, balance: 800, ready: true, avatarUrl: null, betsConfirmed: true },
    { id: 'p2', name: 'Bob', userId: 'u2', isHost: false, connected: true, balance: 650, ready: true, avatarUrl: null, betsConfirmed: true },
    { id: 'p3', name: 'Charlie', userId: 'u3', isHost: false, connected: true, balance: 920, ready: true, avatarUrl: null, betsConfirmed: true },
    { id: 'p4', name: 'Diana', userId: 'u4', isHost: false, connected: true, balance: 500, ready: true, avatarUrl: null, betsConfirmed: true },
  ];

  let id = 0;
  const bet = (playerId: string, type: BetType, amount: number, point?: number): Bet =>
    ({ id: `dbg-${++id}`, playerId, type, amount, point });

  const pids = ['p1', 'p2', 'p3', 'p4'];
  const all = (type: BetType, amounts: number[], point?: number) =>
    pids.map((pid, i) => bet(pid, type, amounts[i], point));

  const fakeBets: Bet[] = [
    // Pass line
    ...all('pass', [25, 50, 10, 100]),
    // Don't Pass
    ...all('dontPass', [25, 15, 50, 30]),
    // Pass Odds
    ...all('passOdds', [50, 100, 25, 75]),
    // Field
    ...all('field', [5, 10, 25, 5]),
    // Place bets on every number
    ...all('place4', [25, 50, 10, 25]),
    ...all('place5', [25, 50, 10, 25]),
    ...all('place6', [30, 60, 30, 18]),
    ...all('place8', [30, 60, 12, 30]),
    ...all('place9', [25, 50, 25, 10]),
    ...all('place10', [25, 50, 10, 25]),
    // Come bets — unestablished (in COME zone)
    ...all('come', [25, 10, 15, 50]),
    // Come bets — established on numbers
    ...all('come', [30, 50, 20, 25], 6),
    ...all('come', [25, 40, 15, 30], 9),
    // Don't Come — unestablished
    ...all('dontCome', [25, 20, 30, 15]),
    // Don't Come — established on numbers
    ...all('dontCome', [25, 30, 50, 20], 4),
    ...all('dontCome', [20, 25, 15, 40], 10),
  ];

  return { fakePlayers, fakeBets };
}

export function CrapsTable({ point: realPoint, bets: realBets, players: realPlayers, myPlayerId, onPlaceBet, phase, betsConfirmed, selectedChip }: CrapsTableProps) {
  // Debug override
  const { fakePlayers, fakeBets } = DEBUG_FULL_BOARD ? makeDebugData() : { fakePlayers: null, fakeBets: null };
  const point = DEBUG_FULL_BOARD ? 8 : realPoint;
  const bets = fakeBets ?? realBets;
  const players = fakePlayers ?? realPlayers;

  const canBet = phase === 'betting' && !betsConfirmed;
  const isComingOut = point === null;

  const getAmount = (betType: BetType) => snapBetAmount(selectedChip, betType, point);

  const handleClick = (betType: BetType) => {
    if (!canBet) return;
    onPlaceBet(betType, getAmount(betType));
  };

  const getBets = (betType: BetType) => bets.filter((b) => b.type === betType);

  /** Come/don't-come bets that have established a point on a given number */
  const getComeBetsOnNumber = (num: number) =>
    bets.filter((b) => b.type === 'come' && b.point === num);
  const getDontComeBetsOnNumber = (num: number) =>
    bets.filter((b) => b.type === 'dontCome' && b.point === num);

  /** Come/don't-come bets still waiting in their zone (no point yet) */
  const unestablishedComeBets = bets.filter((b) => b.type === 'come' && !b.point);
  const unestablishedDontComeBets = bets.filter((b) => b.type === 'dontCome' && !b.point);

  return (
    <div className={styles.tableWrap}>
      {/* Outer rail */}
      <div className={styles.rail}>
        {/* Felt surface */}
        <div className={styles.felt}>
          <div className={styles.feltNoise} />

          {/* Don't Pass Bar */}
          <button
            className={`${styles.zone} ${styles.dontPass} ${canBet && isComingOut ? styles.zoneBettable : ''}`}
            onClick={() => handleClick('dontPass')}
            disabled={!canBet || !isComingOut}
          >
            <span className={styles.zoneLabel}>DON&#39;T PASS BAR</span>
            <ChipStack bets={getBets('dontPass')} players={players} zone="dontPass" />
          </button>

          {/* Number Boxes */}
          <div className={styles.numberRow}>
            {PLACE_NUMBERS.map((num) => {
              const betType = PLACE_BET_MAP[num];
              const isClickable = canBet;
              const isPoint = point === num;
              const comeBetsHere = getComeBetsOnNumber(num);
              const dontComeBetsHere = getDontComeBetsOnNumber(num);

              return (
                <button
                  key={num}
                  className={[
                    styles.numberBox,
                    isClickable ? styles.numberBoxBettable : '',
                    isPoint ? styles.numberBoxPoint : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleClick(betType)}
                  disabled={!isClickable}
                >
                  <span className={`${styles.numberLabel} ${num === 6 || num === 9 ? styles.numberLabelText : ''}`}>
                    {NUMBER_DISPLAY[num]}
                  </span>
                  {isPoint && <PointPuck point={point} />}
                  <ChipStack bets={getBets(betType)} players={players} zone="number" />

                  {comeBetsHere.length > 0 && (
                    <BetIndicatorRow bets={comeBetsHere} players={players} label="C" position="bottom" />
                  )}
                  {dontComeBetsHere.length > 0 && (
                    <BetIndicatorRow bets={dontComeBetsHere} players={players} label="DC" position="top" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Don't Come + Come row */}
          <div className={styles.dcRow}>
            <button
              className={`${styles.zone} ${styles.dontCome} ${canBet && !isComingOut ? styles.zoneBettable : ''}`}
              onClick={() => handleClick('dontCome')}
              disabled={!canBet || isComingOut}
            >
              <span className={styles.zoneLabel}>DON&#39;T COME</span>
              <ChipStack bets={unestablishedDontComeBets} players={players} zone="dontCome" />
            </button>

            <button
              className={`${styles.zone} ${styles.come} ${canBet && !isComingOut ? styles.zoneBettable : ''}`}
              onClick={() => handleClick('come')}
              disabled={!canBet || isComingOut}
            >
              <span className={styles.comeLabel}>COME</span>
              <ChipStack bets={unestablishedComeBets} players={players} zone="come" />
            </button>
          </div>

          {/* Field */}
          <button
            className={`${styles.zone} ${styles.field} ${canBet ? styles.zoneBettable : ''}`}
            onClick={() => handleClick('field')}
            disabled={!canBet}
          >
            <div className={styles.fieldInner}>
              <span className={styles.fieldPayHigh}>2 pays Double</span>
              <span className={styles.fieldLabel}>F I E L D</span>
              <span className={styles.fieldNums}>3 · 4 · 9 · 10 · 11</span>
              <span className={styles.fieldPayHigh}>12 pays Triple</span>
            </div>
            <ChipStack bets={getBets('field')} players={players} zone="field" />
          </button>

          {/* Pass Odds — always rendered for layout stability, hidden on come-out */}
          <button
            className={`${styles.zone} ${styles.passOdds} ${
              isComingOut ? styles.zoneHidden : ''
            } ${
              canBet && !isComingOut && bets.some((b) => b.playerId === myPlayerId && b.type === 'pass') ? styles.zoneBettable : ''
            }`}
            onClick={() => handleClick('passOdds')}
            disabled={isComingOut || !canBet || !bets.some((b) => b.playerId === myPlayerId && b.type === 'pass')}
          >
            <span className={styles.oddsLabel}>PASS LINE ODDS</span>
            <ChipStack bets={getBets('passOdds')} players={players} zone="passOdds" />
          </button>

          {/* Pass Line */}
          <button
            className={`${styles.zone} ${styles.passLine} ${canBet && isComingOut ? styles.zoneBettable : ''}`}
            onClick={() => handleClick('pass')}
            disabled={!canBet || !isComingOut}
          >
            <span className={styles.passLineLabel}>P A S S&nbsp;&nbsp;L I N E</span>
            <ChipStack bets={getBets('pass')} players={players} zone="pass" />
          </button>
        </div>
      </div>
    </div>
  );
}
