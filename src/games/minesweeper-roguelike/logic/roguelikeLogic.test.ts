import { describe, it, expect } from 'vitest';
import {
  calculateRevealScore,
  calculateFloorClearBonus,
  countRevealedCells,
  checkFloorCleared,
  calculateMineCount5x5,
  countZeroCells,
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

describe('calculateMineCount5x5', () => {
  it('counts mines within 5x5 area and respects boundaries', () => {
    const board = createTestBoard(7, 7);
    board[3][3].isMine = true; // Center
    board[1][1].isMine = true; // Within 5x5 of center
    board[0][0].isMine = true; // Outside 5x5 from center (3,3)

    // From center (3,3), should see 2 mines (at 3,3 and 1,1)
    expect(calculateMineCount5x5(board, 3, 3)).toBe(2);

    // From corner (0,0), should only see mines within bounds
    expect(calculateMineCount5x5(board, 0, 0)).toBe(2);
  });
});

describe('countZeroCells', () => {
  it('counts non-mine cells with 0 adjacent mines', () => {
    const board = createTestBoard(3, 3);
    // Set all to have adjacent mines
    for (const row of board) {
      for (const cell of row) {
        cell.adjacentMines = 1;
      }
    }

    board[0][0].adjacentMines = 0;
    board[1][1].adjacentMines = 0;
    board[1][1].isMine = true; // Should not count

    expect(countZeroCells(board)).toBe(1);
  });
});
