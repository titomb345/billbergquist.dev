import type { Bet, BetType, CrapsPhase, Player } from '../types';
import { snapBetAmount, groupBetsByPlayer, isContractBet } from '../engine';
import styles from './CrapsTable.module.css';

interface CrapsTableProps {
  point: number | null;
  bets: Bet[];
  players: Player[];
  myPlayerId: string;
  onPlaceBet: (betType: BetType, amount: number, betPoint?: number) => void;
  onRemoveBet: (betId: string) => void;
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
type ChipZone = 'dontPass' | 'number' | 'dontCome' | 'come' | 'field' | 'passOdds' | 'dontPassOdds' | 'pass';

const CHIP_POSITIONS: Record<ChipZone, [number, number][]> = {
  // ~680px wide (in grid with dontPassOdds) — evenly spaced
  dontPass: [
    [-260, 0], [-140, 0], [140, 0], [260, 0],
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
  // Full-width ~820px pass odds strip
  passOdds: [
    [-300, 0], [-140, 0], [140, 0], [300, 0],
  ],
  // ~140px narrow zone next to don't pass bar
  dontPassOdds: [
    [-25, -8], [25, -8],
    [-25, 8],  [25, 8],
  ],
  // Full-width ~820px, curved bottom
  pass: [
    [-300, 0], [-180, 0], [180, 0], [300, 0],
  ],
};

/** Resolve player index, color, and name from a playerId */
function resolvePlayer(playerId: string, players: Player[], colors: string[]) {
  const idx = players.findIndex((p) => p.id === playerId);
  const slotIdx = idx % colors.length;
  return { idx, slotIdx, color: colors[slotIdx], name: players[idx]?.name ?? 'Player' };
}

interface ChipStackProps {
  bets: Bet[];
  players: Player[];
  zone: ChipZone;
}

function ChipStack({ bets, players, zone }: ChipStackProps) {
  if (bets.length === 0) return null;

  const byPlayer = groupBetsByPlayer(bets);
  const positions = CHIP_POSITIONS[zone];
  const colors = getPlayerColors();

  return (
    <div className={styles.chipStack}>
      {[...byPlayer.entries()].map(([playerId, total]) => {
        const { slotIdx, color: playerColor, name: playerName } = resolvePlayer(playerId, players, colors);
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

/** DRY helper: renders player-colored dots with tooltips for a set of bets */
function PlayerDots({ bets, players }: { bets: Bet[]; players: Player[] }) {
  const byPlayer = groupBetsByPlayer(bets);
  const colors = getPlayerColors();
  return (
    <>
      {[...byPlayer.entries()].map(([playerId, total]) => {
        const { color, name } = resolvePlayer(playerId, players, colors);
        return (
          <div key={playerId} className={styles.indicatorDotWrap}>
            <div className={styles.comeIndicatorDot} style={{ background: color }} />
            <div className={styles.chipTooltip}>
              <span className={styles.tooltipDot} style={{ background: color }} />
              <span className={styles.tooltipName}>{name}</span>
              <span className={styles.tooltipAmount}>${total}</span>
            </div>
          </div>
        );
      })}
    </>
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

/** Center bet definitions: row 1 = hardways, row 2 = props */
const CENTER_BETS: { type: BetType; label: string }[] = [
  { type: 'hard4', label: 'H4' },
  { type: 'hard6', label: 'H6' },
  { type: 'hard8', label: 'H8' },
  { type: 'hard10', label: 'H10' },
  { type: 'anyCraps', label: 'CRAPS' },
  { type: 'anySeven', label: 'ANY 7' },
  { type: 'yo', label: 'YO' },
  { type: 'horn', label: 'HORN' },
];

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
    // Don't Pass Odds
    ...all('dontPassOdds', [25, 50, 30, 40]),
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
    // Hardways
    ...all('hard4', [5, 10, 5, 10]),
    ...all('hard6', [10, 5, 10, 5]),
    ...all('hard8', [5, 5, 10, 10]),
    ...all('hard10', [10, 10, 5, 5]),
    // Props
    ...all('anyCraps', [5, 5, 5, 5]),
    ...all('anySeven', [10, 5, 10, 5]),
    ...all('yo', [5, 10, 5, 10]),
    ...all('horn', [5, 5, 5, 5]),
  ];

  return { fakePlayers, fakeBets };
}

/** Build a bet index keyed by "type" or "type:point" for O(1) lookups */
function indexBets(bets: Bet[]) {
  const byType = new Map<string, Bet[]>();
  const push = (key: string, bet: Bet) => {
    const arr = byType.get(key);
    if (arr) arr.push(bet);
    else byType.set(key, [bet]);
  };
  for (const b of bets) {
    push(b.type, b);
    if (b.point != null) push(`${b.type}:${b.point}`, b);
    else push(`${b.type}:none`, b);
  }
  return byType;
}

const EMPTY_BETS: Bet[] = [];

export function CrapsTable({ point: realPoint, bets: realBets, players: realPlayers, myPlayerId, onPlaceBet, onRemoveBet, phase, betsConfirmed, selectedChip }: CrapsTableProps) {
  // Debug override
  const { fakePlayers, fakeBets } = DEBUG_FULL_BOARD ? makeDebugData() : { fakePlayers: null, fakeBets: null };
  const point = DEBUG_FULL_BOARD ? 8 : realPoint;
  const bets = fakeBets ?? realBets;
  const players = fakePlayers ?? realPlayers;

  const canBet = phase === 'betting' && !betsConfirmed;
  const isComingOut = point === null;

  // Pre-index all bets once instead of repeated .filter() calls
  const betIndex = indexBets(bets);
  const getBets = (betType: BetType) => betIndex.get(betType) ?? EMPTY_BETS;
  const getBetsByPoint = (betType: BetType, pt: number) => betIndex.get(`${betType}:${pt}`) ?? EMPTY_BETS;
  const unestablishedComeBets = betIndex.get('come:none') ?? EMPTY_BETS;
  const unestablishedDontComeBets = betIndex.get('dontCome:none') ?? EMPTY_BETS;

  const hasMyPassBet = getBets('pass').some((b) => b.playerId === myPlayerId);
  const hasMyDontPassBet = getBets('dontPass').some((b) => b.playerId === myPlayerId);

  const getAmount = (betType: BetType) => snapBetAmount(selectedChip, betType, point);

  const handleClick = (betType: BetType) => {
    if (!canBet) return;
    onPlaceBet(betType, getAmount(betType));
  };

  /** Right-click: remove my last removable bet of this type */
  const handleContextRemove = (e: React.MouseEvent, betType: BetType) => {
    e.preventDefault();
    if (!canBet) return;
    const myRemovable = getBets(betType).filter(
      (b) => b.playerId === myPlayerId && !isContractBet(b, point),
    );
    if (myRemovable.length > 0) {
      onRemoveBet(myRemovable[myRemovable.length - 1].id);
    }
  };

  return (
    <div className={styles.tableWrap}>
      {/* Outer rail */}
      <div className={styles.rail}>
        {/* Felt surface */}
        <div className={styles.felt}>
          <div className={styles.feltNoise} />

          {/* Number Boxes */}
          <div className={styles.numberRow}>
            {PLACE_NUMBERS.map((num) => {
              const betType = PLACE_BET_MAP[num];
              const isClickable = canBet;
              const isPoint = point === num;
              const comeBetsHere = getBetsByPoint('come', num);
              const dontComeBetsHere = getBetsByPoint('dontCome', num);
              const comeOddsHere = getBetsByPoint('comeOdds', num);
              const dontComeOddsHere = getBetsByPoint('dontComeOdds', num);

              return (
                <button
                  key={num}
                  className={[
                    styles.numberBox,
                    isClickable ? styles.numberBoxBettable : '',
                    isPoint ? styles.numberBoxPoint : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleClick(betType)}
                  onContextMenu={(e) => handleContextRemove(e, betType)}
                  disabled={!isClickable}
                >
                  <span className={`${styles.numberLabel} ${num === 6 || num === 9 ? styles.numberLabelText : ''}`}>
                    {NUMBER_DISPLAY[num]}
                  </span>
                  {isPoint && <PointPuck point={point} />}
                  <ChipStack bets={getBets(betType)} players={players} zone="number" />

                  {(comeBetsHere.length > 0 || comeOddsHere.length > 0) && (
                    <div className={styles.comeIndicators}>
                      {comeBetsHere.length > 0 && (
                        <>
                          <span className={styles.comeIndicatorBadge}>C</span>
                          <PlayerDots bets={comeBetsHere} players={players} />
                        </>
                      )}
                      {comeOddsHere.length > 0 && (
                        <>
                          <span className={styles.comeIndicatorBadge}>CO</span>
                          <PlayerDots bets={comeOddsHere} players={players} />
                        </>
                      )}
                    </div>
                  )}
                  {(dontComeBetsHere.length > 0 || dontComeOddsHere.length > 0) && (
                    <div className={styles.dontComeIndicators}>
                      {dontComeBetsHere.length > 0 && (
                        <>
                          <span className={styles.dontComeIndicatorBadge}>DC</span>
                          <PlayerDots bets={dontComeBetsHere} players={players} />
                        </>
                      )}
                      {dontComeOddsHere.length > 0 && (
                        <>
                          <span className={styles.dontComeIndicatorBadge}>DCO</span>
                          <PlayerDots bets={dontComeOddsHere} players={players} />
                        </>
                      )}
                    </div>
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
              onContextMenu={(e) => handleContextRemove(e, 'dontCome')}
              disabled={!canBet || isComingOut}
            >
              <span className={styles.zoneLabel}>DON&#39;T COME</span>
              <ChipStack bets={unestablishedDontComeBets} players={players} zone="dontCome" />
            </button>

            <button
              className={`${styles.zone} ${styles.come} ${canBet && !isComingOut ? styles.zoneBettable : ''}`}
              onClick={() => handleClick('come')}
              onContextMenu={(e) => handleContextRemove(e, 'come')}
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
            onContextMenu={(e) => handleContextRemove(e, 'field')}
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

          {/* Center Bets (hardways + props) */}
          <div className={styles.centerBets}>
            {CENTER_BETS.map(({ type, label }) => (
              <button
                key={type}
                className={`${styles.centerCell} ${canBet ? styles.centerCellBettable : ''}`}
                onClick={() => handleClick(type)}
                onContextMenu={(e) => handleContextRemove(e, type)}
                disabled={!canBet}
              >
                <span className={styles.centerCellLabel}>{label}</span>
                <div className={styles.centerCellDots}>
                  <PlayerDots bets={getBets(type)} players={players} />
                </div>
              </button>
            ))}
          </div>

          {/* Don't Pass Bar + Don't Pass Odds */}
          <div className={styles.dontPassRow}>
            <button
              className={`${styles.zone} ${styles.dontPass} ${canBet && isComingOut ? styles.zoneBettable : ''}`}
              onClick={() => handleClick('dontPass')}
              onContextMenu={(e) => handleContextRemove(e, 'dontPass')}
              disabled={!canBet || !isComingOut}
            >
              <span className={styles.zoneLabel}>DON&#39;T PASS BAR</span>
              <ChipStack bets={getBets('dontPass')} players={players} zone="dontPass" />
            </button>

            <button
              className={`${styles.zone} ${styles.dontPassOdds} ${
                canBet && !isComingOut && hasMyDontPassBet ? styles.zoneBettable : ''
              }`}
              onClick={() => handleClick('dontPassOdds')}
              onContextMenu={(e) => handleContextRemove(e, 'dontPassOdds')}
              disabled={isComingOut || !canBet || !hasMyDontPassBet}
            >
              <span className={styles.oddsLabel}>DON&#39;T PASS ODDS</span>
              <ChipStack bets={getBets('dontPassOdds')} players={players} zone="dontPassOdds" />
            </button>
          </div>

          {/* Pass Line Odds — always visible on felt */}
          <button
            className={`${styles.zone} ${styles.passOdds} ${
              canBet && !isComingOut && hasMyPassBet ? styles.zoneBettable : ''
            }`}
            onClick={() => handleClick('passOdds')}
            onContextMenu={(e) => handleContextRemove(e, 'passOdds')}
            disabled={isComingOut || !canBet || !hasMyPassBet}
          >
            <span className={styles.oddsLabel}>PASS LINE ODDS</span>
            <ChipStack bets={getBets('passOdds')} players={players} zone="passOdds" />
          </button>

          {/* Pass Line */}
          <button
            className={`${styles.zone} ${styles.passLine} ${canBet && isComingOut ? styles.zoneBettable : ''}`}
            onClick={() => handleClick('pass')}
            onContextMenu={(e) => handleContextRemove(e, 'pass')}
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
