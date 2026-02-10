import { describe, it, expect } from 'vitest';
import {
  calculateRevealScore,
  calculateFloorClearBonus,
  countRevealedCells,
  checkFloorCleared,
  calculateMineCount4x4,
  calculateOpeningsMapCells,
  calculatePatternMemoryCell,
} from './roguelikeLogic';
import { Cell, CellState } from '../types';
import { SCORING } from '../constants';

// Helper to create a simple board
function createTestBoard(rows: number, cols: number): Cell[][] {
  const board: Cell[][] = [];
  for (let row = 0; row < rows; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      rowCells.push({
        row,
        col,
        isMine: false,
        state: CellState.Hidden,
        adjacentMines: 0,
      });
    }
    board.push(rowCells);
  }
  return board;
}

describe('calculateRevealScore', () => {
  it('calculates score with floor multiplier', () => {
    const floor1 = calculateRevealScore(10, 1);
    const floor3 = calculateRevealScore(10, 3);

    expect(floor1).toBe(10 * SCORING.BASE_CELL_REVEAL);

    // Floor 3 should have 1.5^2 multiplier
    const expectedMultiplier = Math.pow(SCORING.FLOOR_MULTIPLIER, 2);
    expect(floor3).toBe(Math.floor(10 * SCORING.BASE_CELL_REVEAL * expectedMultiplier));
  });

  it('returns 0 for 0 cells revealed', () => {
    expect(calculateRevealScore(0, 5)).toBe(0);
  });
});

describe('calculateFloorClearBonus', () => {
  it('scales bonus with floor and applies time bonus', () => {
    const slowClear = calculateFloorClearBonus(3, 120);
    const fastClear = calculateFloorClearBonus(3, SCORING.TIME_BONUS_THRESHOLD - 1);

    expect(slowClear).toBe(SCORING.FLOOR_CLEAR_BONUS * 3);
    expect(fastClear).toBe(Math.floor(slowClear * SCORING.TIME_BONUS_MULTIPLIER));
  });
});

describe('countRevealedCells', () => {
  it('counts only revealed non-mine cells', () => {
    const board = createTestBoard(3, 3);
    board[0][0].state = CellState.Revealed;
    board[0][1].state = CellState.Revealed;
    board[1][1].state = CellState.Revealed;
    board[1][1].isMine = true; // Should not count

    expect(countRevealedCells(board)).toBe(2);
  });
});

describe('checkFloorCleared', () => {
  it('returns true only when all non-mine cells are revealed', () => {
    const board = createTestBoard(2, 2);
    board[0][0].isMine = true;

    expect(checkFloorCleared(board)).toBe(false);

    board[0][1].state = CellState.Revealed;
    board[1][0].state = CellState.Revealed;
    board[1][1].state = CellState.Revealed;

    expect(checkFloorCleared(board)).toBe(true);
  });
});

describe('calculateMineCount4x4', () => {
  it('counts mines within 4x4 area (offsets -1 to +2) and respects boundaries', () => {
    const board = createTestBoard(7, 7);
    board[3][3].isMine = true; // Center
    board[2][2].isMine = true; // Within 4x4 of center (offset -1,-1)
    board[5][5].isMine = true; // Within 4x4 of center (offset +2,+2)
    board[1][1].isMine = true; // Outside 4x4 from center (3,3) - offset -2,-2

    // From center (3,3), 4x4 covers rows 2-5, cols 2-5
    // Should see mines at (3,3), (2,2), (5,5) = 3
    expect(calculateMineCount4x4(board, 3, 3)).toBe(3);

    // From corner (0,0), 4x4 covers rows -1 to 2, cols -1 to 2 (clamped to 0-2)
    // Should see mines at (1,1) and (2,2) = 2
    expect(calculateMineCount4x4(board, 0, 0)).toBe(2);
  });
});

describe('calculateOpeningsMapCells', () => {
  it('returns empty set when no zero cells exist', () => {
    const board = createTestBoard(3, 3);
    for (const row of board) {
      for (const cell of row) {
        cell.adjacentMines = 1;
      }
    }
    expect(calculateOpeningsMapCells(board).size).toBe(0);
  });

  it('returns at most 3 cells', () => {
    const board = createTestBoard(8, 8);
    // Create a large open region in center
    board[3][3].adjacentMines = 0;
    board[3][4].adjacentMines = 0;
    board[4][3].adjacentMines = 0;
    board[4][4].adjacentMines = 0;
    // Surrounding cells have adjacentMines = 1 (default from createTestBoard is 0, so set them)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!((r === 3 || r === 4) && (c === 3 || c === 4))) {
          board[r][c].adjacentMines = 1;
        }
      }
    }
    const result = calculateOpeningsMapCells(board);
    expect(result.size).toBeLessThanOrEqual(3);
    expect(result.size).toBeGreaterThan(0);
  });

  it('excludes mine cells from candidates', () => {
    const board = createTestBoard(5, 5);
    board[2][2].adjacentMines = 0; // single zero cell
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r !== 2 || c !== 2) board[r][c].adjacentMines = 1;
      }
    }
    // Make all Manhattan-distance-2 cells mines
    // distance-2 cells from (2,2): (0,2), (2,0), (4,2), (2,4), (0,4)...
    board[0][2].isMine = true;
    board[2][0].isMine = true;
    board[4][2].isMine = true;
    board[2][4].isMine = true;
    board[0][4].isMine = true;
    board[4][0].isMine = true;
    board[4][4].isMine = true;
    board[0][0].isMine = true;

    const result = calculateOpeningsMapCells(board);
    // All highlighted cells should be non-mines
    for (const key of result) {
      const [r, c] = key.split(',').map(Number);
      expect(board[r][c].isMine).toBe(false);
    }
  });
});

describe('calculatePatternMemoryCell', () => {
  it('returns null for cells with less than 3 adjacent mines', () => {
    const board = createTestBoard(3, 3);
    board[1][1].state = CellState.Revealed;
    board[1][1].adjacentMines = 2;

    expect(calculatePatternMemoryCell(board, 1, 1)).toBe(null);
  });

  it('returns null for hidden cells', () => {
    const board = createTestBoard(3, 3);
    board[1][1].adjacentMines = 3;
    // Cell is still hidden

    expect(calculatePatternMemoryCell(board, 1, 1)).toBe(null);
  });

  it('returns a random safe neighbor for revealed 3+ cells', () => {
    const board = createTestBoard(3, 3);
    board[1][1].state = CellState.Revealed;
    board[1][1].adjacentMines = 3;
    // All surrounding cells are hidden and safe

    const result = calculatePatternMemoryCell(board, 1, 1);
    expect(result).not.toBe(null);

    // Should be one of the 8 surrounding cells
    const validCells = ['0,0', '0,1', '0,2', '1,0', '1,2', '2,0', '2,1', '2,2'];
    expect(validCells).toContain(result);
  });

  it('excludes mine neighbors from safe neighbor pool', () => {
    const board = createTestBoard(3, 3);
    board[1][1].state = CellState.Revealed;
    board[1][1].adjacentMines = 3;

    // Make all neighbors except (0,0) mines
    board[0][1].isMine = true;
    board[0][2].isMine = true;
    board[1][0].isMine = true;
    board[1][2].isMine = true;
    board[2][0].isMine = true;
    board[2][1].isMine = true;
    board[2][2].isMine = true;

    // Only (0,0) is safe and hidden
    const result = calculatePatternMemoryCell(board, 1, 1);
    expect(result).toBe('0,0');
  });

  it('excludes already revealed neighbors', () => {
    const board = createTestBoard(3, 3);
    board[1][1].state = CellState.Revealed;
    board[1][1].adjacentMines = 4;

    // Reveal all neighbors except (2,2)
    board[0][0].state = CellState.Revealed;
    board[0][1].state = CellState.Revealed;
    board[0][2].state = CellState.Revealed;
    board[1][0].state = CellState.Revealed;
    board[1][2].state = CellState.Revealed;
    board[2][0].state = CellState.Revealed;
    board[2][1].state = CellState.Revealed;

    // Only (2,2) is hidden and safe
    const result = calculatePatternMemoryCell(board, 1, 1);
    expect(result).toBe('2,2');
  });

  it('returns null when no safe hidden neighbors exist', () => {
    const board = createTestBoard(3, 3);
    board[1][1].state = CellState.Revealed;
    board[1][1].adjacentMines = 3;

    // All neighbors are mines
    board[0][0].isMine = true;
    board[0][1].isMine = true;
    board[0][2].isMine = true;
    board[1][0].isMine = true;
    board[1][2].isMine = true;
    board[2][0].isMine = true;
    board[2][1].isMine = true;
    board[2][2].isMine = true;

    expect(calculatePatternMemoryCell(board, 1, 1)).toBe(null);
  });

  it('handles edge cells correctly', () => {
    const board = createTestBoard(3, 3);
    board[0][0].state = CellState.Revealed;
    board[0][0].adjacentMines = 3;

    const result = calculatePatternMemoryCell(board, 0, 0);
    expect(result).not.toBe(null);

    // Should be one of the 3 valid neighbors for corner cell
    const validCells = ['0,1', '1,0', '1,1'];
    expect(validCells).toContain(result);
  });
});
