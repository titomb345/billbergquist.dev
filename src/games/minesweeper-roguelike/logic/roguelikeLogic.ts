import { Cell, CellState, GamePhase, PowerUpId, RoguelikeGameState, RunState } from '../types';
import { getFloorConfig, SCORING, MAX_FLOOR } from '../constants';
import { createEmptyBoard, revealCell, revealCascade } from './gameLogic';
import { AscensionLevel, getAscensionModifiers } from '../ascension';

// Generate a short run seed for sharing/comparing runs
function generateRunSeed(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0/O, 1/I
  let seed = '';
  for (let i = 0; i < 6; i++) {
    seed += chars[Math.floor(Math.random() * chars.length)];
  }
  return seed;
}

// Create initial run state
export function createInitialRunState(ascensionLevel: AscensionLevel = 0): RunState {
  return {
    currentFloor: 1,
    score: 0,
    activePowerUps: [],
    ironWillAvailable: true,
    xRayUsedThisFloor: false,
    luckyStartUsedThisFloor: false,
    quickRecoveryUsedThisRun: false,
    momentumActive: false,
    peekUsedThisFloor: false,
    safePathUsedThisFloor: false,
    defusalKitUsedThisFloor: false,
    surveyUsedThisFloor: false,
    seed: generateRunSeed(),
    ascensionLevel,
  };
}

// Create initial roguelike game state for a new run
export function createRoguelikeInitialState(
  isMobile: boolean,
  ascensionLevel: AscensionLevel = 0
): RoguelikeGameState {
  const floorConfig = getFloorConfig(1, isMobile, ascensionLevel);
  return {
    phase: GamePhase.Start,
    board: createEmptyBoard(floorConfig),
    floorConfig,
    minesRemaining: floorConfig.mines,
    time: 0,
    isFirstClick: true,
    isMobile,
    run: createInitialRunState(ascensionLevel),
    draftOptions: [],
    dangerCells: new Set(),
    chordHighlightCells: new Set(),
    patternMemoryCells: new Set(),
    explodedCell: null,
    closeCallCell: null,
    zeroCellCount: null,
    peekCell: null,
    surveyResult: null,
    heatMapEnabled: true, // TEMPORARY: Enable for testing
    cellsRevealedThisFloor: 0,
    cellRevealTimes: new Map(),
    fadedCells: new Set(),
  };
}

// Set up a new floor (called when starting run or advancing to next floor)
export function setupFloor(state: RoguelikeGameState, floor: number): RoguelikeGameState {
  const modifiers = getAscensionModifiers(state.run.ascensionLevel);
  const floorConfig = getFloorConfig(floor, state.isMobile, state.run.ascensionLevel);
  const board = createEmptyBoard(floorConfig);

  // Check if player has Heat Map power-up
  const hasHeatMap = hasPowerUp(state.run, 'heat-map');

  // A2: Initialize countdown timer if applicable
  const initialTime = modifiers.timerCountdown ?? 0;

  return {
    ...state,
    phase: GamePhase.Playing,
    board,
    floorConfig,
    minesRemaining: floorConfig.mines,
    time: initialTime,
    isFirstClick: true,
    dangerCells: new Set(),
    chordHighlightCells: new Set(),
    patternMemoryCells: new Set(),
    explodedCell: null,
    closeCallCell: null,
    zeroCellCount: null, // Will be set after first click if Floor Scout is active
    peekCell: null,
    surveyResult: null,
    heatMapEnabled: hasHeatMap,
    cellsRevealedThisFloor: 0,
    cellRevealTimes: new Map(), // A4: Reset reveal times for new floor
    fadedCells: new Set(), // A4: Reset faded cells for new floor
    run: {
      ...state.run,
      currentFloor: floor,
      xRayUsedThisFloor: false,
      luckyStartUsedThisFloor: false,
      momentumActive: false,
      peekUsedThisFloor: false,
      safePathUsedThisFloor: false,
      defusalKitUsedThisFloor: false,
      surveyUsedThisFloor: false,
    },
  };
}

// Check if player has a specific power-up
export function hasPowerUp(run: RunState, powerUpId: PowerUpId): boolean {
  return run.activePowerUps.some((p) => p.id === powerUpId);
}

// Calculate danger cells (cells adjacent to 3+ mines) for Danger Sense
// Limited to 3 cells maximum to balance the power-up
export function calculateDangerCells(board: Cell[][]): Set<string> {
  const candidates: string[] = [];
  const rows = board.length;
  const cols = board[0]?.length || 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = board[row][col];
      if (cell.state === CellState.Hidden && !cell.isMine && cell.adjacentMines >= 3) {
        candidates.push(`${row},${col}`);
      }
    }
  }

  // Shuffle and take up to 3 cells
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return new Set(candidates.slice(0, 3));
}

// Apply Lucky Start: reveal 3 random safe cells scattered across the board
export function applyLuckyStart(board: Cell[][]): Cell[][] {
  let newBoard = board;
  const rows = board.length;
  const cols = board[0].length;

  // Pre-compute revealed positions once (optimization: O(n) instead of O(n) per safe cell)
  const getRevealedPositions = (b: Cell[][]): Array<{ row: number; col: number }> => {
    const positions: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (b[r][c].state === CellState.Revealed) {
          positions.push({ row: r, col: c });
        }
      }
    }
    return positions;
  };

  // Find all hidden safe cells
  const getHiddenSafeCells = (b: Cell[][]): Array<{ row: number; col: number }> => {
    const cells: Array<{ row: number; col: number }> = [];
    for (const row of b) {
      for (const cell of row) {
        if (!cell.isMine && cell.state === CellState.Hidden) {
          cells.push({ row: cell.row, col: cell.col });
        }
      }
    }
    return cells;
  };

  // Reveal up to 3 cells, preferring cells far from already-revealed areas
  for (let i = 0; i < 3; i++) {
    const safeCells = getHiddenSafeCells(newBoard);
    if (safeCells.length === 0) break;

    // Cache revealed positions for this iteration
    const revealedPositions = getRevealedPositions(newBoard);

    // Score cells by distance from revealed cells (prefer isolated cells)
    // Now O(safeCells * revealedPositions) instead of O(safeCells * rows * cols)
    const scoredCells = safeCells.map((pos) => {
      let minDistToRevealed = Infinity;
      for (const revealed of revealedPositions) {
        const dist = Math.abs(pos.row - revealed.row) + Math.abs(pos.col - revealed.col);
        minDistToRevealed = Math.min(minDistToRevealed, dist);
      }
      return { ...pos, score: minDistToRevealed };
    });

    // Sort by score (highest first = furthest from revealed)
    scoredCells.sort((a, b) => b.score - a.score);

    // Pick from top candidates with some randomness
    const topCandidates = scoredCells.slice(0, Math.max(3, Math.floor(scoredCells.length / 3)));
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

    newBoard = revealCell(newBoard, chosen.row, chosen.col);
  }

  return newBoard;
}

// Apply Sixth Sense: find nearest 0-cell and reveal from there for maximum cascade
export function applySixthSense(board: Cell[][], clickRow: number, clickCol: number): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;

  // Find the nearest 0-cell to maximize cascade
  let bestCell: { row: number; col: number } | null = null;
  let bestDist = Infinity;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isMine && cell.adjacentMines === 0 && cell.state === CellState.Hidden) {
        const dist = Math.abs(r - clickRow) + Math.abs(c - clickCol);
        if (dist < bestDist) {
          bestDist = dist;
          bestCell = { row: r, col: c };
        }
      }
    }
  }

  // If we found a 0-cell, reveal from there first, then reveal the clicked cell
  if (bestCell && (bestCell.row !== clickRow || bestCell.col !== clickCol)) {
    let newBoard = revealCell(board, bestCell.row, bestCell.col);
    // Also reveal the originally clicked cell if it's still hidden
    if (newBoard[clickRow][clickCol].state === CellState.Hidden) {
      newBoard = revealCell(newBoard, clickRow, clickCol);
    }
    return newBoard;
  }

  // Fallback: just reveal the clicked cell normally
  return revealCell(board, clickRow, clickCol);
}

// Apply X-Ray Vision: safely reveal 3x3 area
export function applyXRayVision(board: Cell[][], centerRow: number, centerCol: number): Cell[][] {
  let newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const rows = newBoard.length;
  const cols = newBoard[0].length;

  // Collect cells that need cascading (0-cells)
  const cellsToCascade: Array<{ row: number; col: number }> = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = centerRow + dr;
      const c = centerCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const cell = newBoard[r][c];
        if (cell.state === CellState.Hidden) {
          if (cell.isMine) {
            // Mark mines as flagged instead of revealing
            cell.state = CellState.Flagged;
          } else {
            cell.state = CellState.Revealed;
            // Queue 0-cells for cascading after we process all cells
            if (cell.adjacentMines === 0) {
              cellsToCascade.push({ row: r, col: c });
            }
          }
        }
      }
    }
  }

  // Now cascade from all 0-cells found in the 3x3 area
  for (const { row, col } of cellsToCascade) {
    newBoard = revealCascade(newBoard, row, col);
  }

  return newBoard;
}

// Calculate score for revealing cells
export function calculateRevealScore(cellsRevealed: number, floor: number): number {
  const floorMultiplier = Math.pow(SCORING.FLOOR_MULTIPLIER, floor - 1);
  return Math.floor(cellsRevealed * SCORING.BASE_CELL_REVEAL * floorMultiplier);
}

// Calculate floor clear bonus
export function calculateFloorClearBonus(floor: number, time: number): number {
  let bonus = SCORING.FLOOR_CLEAR_BONUS * floor;

  // Time bonus for fast clears
  if (time < SCORING.TIME_BONUS_THRESHOLD) {
    bonus = Math.floor(bonus * SCORING.TIME_BONUS_MULTIPLIER);
  }

  return bonus;
}

// Count revealed cells (for scoring)
export function countRevealedCells(board: Cell[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state === CellState.Revealed && !cell.isMine) {
        count++;
      }
    }
  }
  return count;
}

// Check if all non-mine cells are revealed (floor cleared)
export function checkFloorCleared(board: Cell[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.state !== CellState.Revealed) {
        return false;
      }
    }
  }
  return true;
}

// Check if this is the final floor
export function isFinalFloor(floor: number): boolean {
  return floor >= MAX_FLOOR;
}

// Calculate mine count in 5×5 area for Mine Detector power-up
export function calculateMineCount5x5(
  board: Cell[][],
  centerRow: number,
  centerCol: number
): number {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  let count = 0;

  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = centerRow + dr;
      const c = centerCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].isMine) {
        count++;
      }
    }
  }

  return count;
}

// Calculate cells to highlight for chord preview (adjacent hidden/flagged cells)
export function calculateChordHighlightCells(
  board: Cell[][],
  centerRow: number,
  centerCol: number
): Set<string> {
  const cells = new Set<string>();
  const rows = board.length;
  const cols = board[0]?.length || 0;
  const centerCell = board[centerRow]?.[centerCol];

  // Only highlight if the center cell is a revealed numbered cell
  if (
    !centerCell ||
    centerCell.state !== CellState.Revealed ||
    centerCell.adjacentMines === 0
  ) {
    return cells;
  }

  // Add adjacent hidden or flagged cells
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = centerRow + dr;
      const c = centerCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const cell = board[r][c];
        if (cell.state === CellState.Hidden || cell.state === CellState.Flagged) {
          cells.add(`${r},${c}`);
        }
      }
    }
  }

  return cells;
}

// Apply Edge Walker: reveal/flag corner cells at floor start
export function applyEdgeWalker(board: Cell[][]): Cell[][] {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  if (rows < 2 || cols < 2) return board;

  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: cols - 1 },
    { row: rows - 1, col: 0 },
    { row: rows - 1, col: cols - 1 },
  ];

  let newBoard = board.map((r) => r.map((c) => ({ ...c })));

  for (const { row, col } of corners) {
    const cell = newBoard[row][col];
    if (cell.state !== CellState.Hidden) continue;

    if (cell.isMine) {
      // Flag the mine
      newBoard[row][col] = { ...cell, state: CellState.Flagged };
    } else {
      // Reveal the cell
      newBoard = revealCell(newBoard, row, col);
    }
  }

  return newBoard;
}

// Count cells with 0 adjacent mines for Floor Scout
export function countZeroCells(board: Cell[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.adjacentMines === 0) {
        count++;
      }
    }
  }
  return count;
}

// Calculate Pattern Memory cell: one random safe neighbor after revealing a 3+ cell
export function calculatePatternMemoryCell(
  board: Cell[][],
  revealedRow: number,
  revealedCol: number
): string | null {
  const cell = board[revealedRow]?.[revealedCol];

  // Only trigger for revealed cells with 3+ adjacent mines
  if (!cell || cell.state !== CellState.Revealed || cell.adjacentMines < 3) {
    return null;
  }

  const rows = board.length;
  const cols = board[0]?.length || 0;

  // Collect ALL hidden safe neighbors (not just diagonals)
  const safeNeighbors: string[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = revealedRow + dr;
      const c = revealedCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const neighbor = board[r][c];
        if (!neighbor.isMine && neighbor.state === CellState.Hidden) {
          safeNeighbors.push(`${r},${c}`);
        }
      }
    }
  }

  // Return one random safe neighbor (or null if none)
  if (safeNeighbors.length === 0) return null;
  return safeNeighbors[Math.floor(Math.random() * safeNeighbors.length)];
}

// Apply Safe Path: reveal up to 5 safe cells in a row or column
export function applySafePath(
  board: Cell[][],
  direction: 'row' | 'col',
  index: number
): Cell[][] {
  let newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const rows = newBoard.length;
  const cols = newBoard[0]?.length || 0;

  // Collect hidden safe cells in the specified row or column
  const safeCells: Array<{ row: number; col: number }> = [];

  if (direction === 'row') {
    for (let c = 0; c < cols; c++) {
      const cell = newBoard[index][c];
      if (cell.state === CellState.Hidden && !cell.isMine) {
        safeCells.push({ row: index, col: c });
      }
    }
  } else {
    for (let r = 0; r < rows; r++) {
      const cell = newBoard[r][index];
      if (cell.state === CellState.Hidden && !cell.isMine) {
        safeCells.push({ row: r, col: index });
      }
    }
  }

  // Reveal up to 3 safe cells
  const toReveal = safeCells.slice(0, 3);
  for (const { row, col } of toReveal) {
    newBoard = revealCell(newBoard, row, col);
  }

  return newBoard;
}

// Calculate mine count in a row or column for Survey
export function calculateLineMineCount(
  board: Cell[][],
  direction: 'row' | 'col',
  index: number
): number {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  let count = 0;

  if (direction === 'row') {
    for (let c = 0; c < cols; c++) {
      if (board[index][c].isMine) count++;
    }
  } else {
    for (let r = 0; r < rows; r++) {
      if (board[r][index].isMine) count++;
    }
  }

  return count;
}

// Apply Defusal Kit: remove a flagged mine if correctly flagged
export function applyDefusalKit(
  board: Cell[][],
  row: number,
  col: number
): { board: Cell[][]; success: boolean } {
  const cell = board[row][col];

  // Must be a flagged mine
  if (cell.state !== CellState.Flagged || !cell.isMine) {
    return { board, success: false };
  }

  // Remove the mine and reveal the cell
  const newBoard = board.map((r) =>
    r.map((c) => {
      if (c.row === row && c.col === col) {
        return { ...c, isMine: false, state: CellState.Revealed, adjacentMines: 0 };
      }
      return { ...c };
    })
  );

  // Recalculate adjacent mines for surrounding cells
  const rows = newBoard.length;
  const cols = newBoard[0].length;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols && !newBoard[r][c].isMine) {
        let count = 0;
        for (let ddr = -1; ddr <= 1; ddr++) {
          for (let ddc = -1; ddc <= 1; ddc++) {
            const rr = r + ddr;
            const cc = c + ddc;
            if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && newBoard[rr][cc].isMine) {
              count++;
            }
          }
        }
        newBoard[r][c].adjacentMines = count;
      }
    }
  }

  return { board: newBoard, success: true };
}

// Re-export countFlags from gameLogic to avoid duplication
export { countFlags } from './gameLogic';
