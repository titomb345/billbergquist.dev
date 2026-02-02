import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  calculateAdjacentMines,
  revealCell,
  toggleFlag,
  chordReveal,
  checkWin,
} from './gameLogic';
import { Cell, CellState } from '../types';

// Helper to create a board with specific mine positions
function createBoardWithMines(
  rows: number,
  cols: number,
  minePositions: [number, number][]
): Cell[][] {
  const board: Cell[][] = [];
  for (let row = 0; row < rows; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      const isMine = minePositions.some(([r, c]) => r === row && c === col);
      rowCells.push({
        row,
        col,
        isMine,
        state: CellState.Hidden,
        adjacentMines: 0,
      });
    }
    board.push(rowCells);
  }
  return calculateAdjacentMines(board);
}

describe('createEmptyBoard', () => {
  it('creates a board with correct dimensions and initial state', () => {
    const board = createEmptyBoard({ rows: 5, cols: 7, mines: 3 });

    expect(board).toHaveLength(5);
    expect(board[0]).toHaveLength(7);

    // Verify initial state
    expect(board[0][0].state).toBe(CellState.Hidden);
    expect(board[0][0].isMine).toBe(false);
    expect(board[2][3].row).toBe(2);
    expect(board[2][3].col).toBe(3);
  });
});

describe('calculateAdjacentMines', () => {
  it('calculates correct counts for center and corner mines', () => {
    // 3x3 board with mine in center
    const board = createBoardWithMines(3, 3, [[1, 1]]);

    // All 8 surrounding cells should have adjacentMines = 1
    expect(board[0][0].adjacentMines).toBe(1);
    expect(board[0][2].adjacentMines).toBe(1);
    expect(board[2][0].adjacentMines).toBe(1);
    expect(board[2][2].adjacentMines).toBe(1);
  });

  it('calculates correct counts for multiple adjacent mines', () => {
    // 3x3 board with mines in top-left and top-right
    const board = createBoardWithMines(3, 3, [
      [0, 0],
      [0, 2],
    ]);

    expect(board[0][1].adjacentMines).toBe(2); // Between two mines
    expect(board[1][1].adjacentMines).toBe(2); // Below both mines
    expect(board[1][0].adjacentMines).toBe(1); // Only near one mine
  });

  it('handles toroidal wrapping correctly', () => {
    // 3x3 board with mine at (0,0), toroidal mode
    const board = createBoardWithMines(3, 3, [[0, 0]]);
    const toroidalBoard = calculateAdjacentMines(board, true);

    // In toroidal mode, opposite corners wrap around
    expect(toroidalBoard[2][2].adjacentMines).toBe(1);
    expect(toroidalBoard[2][0].adjacentMines).toBe(1);
    expect(toroidalBoard[0][2].adjacentMines).toBe(1);
  });
});

describe('revealCell', () => {
  it('reveals a hidden cell', () => {
    const board = createBoardWithMines(3, 3, [[2, 2]]);
    const newBoard = revealCell(board, 0, 0);

    expect(newBoard[0][0].state).toBe(CellState.Revealed);
  });

  it('cascades when revealing a zero cell', () => {
    // 5x5 board with mines clustered in bottom-right
    const board = createBoardWithMines(5, 5, [
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
    ]);

    const newBoard = revealCell(board, 0, 0);

    // Should cascade through zero cells
    expect(newBoard[0][0].state).toBe(CellState.Revealed);
    expect(newBoard[0][1].state).toBe(CellState.Revealed);
    expect(newBoard[1][0].state).toBe(CellState.Revealed);
    expect(newBoard[1][1].state).toBe(CellState.Revealed);
  });

  it('does not cascade through flagged cells', () => {
    const board = createBoardWithMines(3, 3, [[2, 2]]);
    board[0][1].state = CellState.Flagged;

    const newBoard = revealCell(board, 0, 0);

    expect(newBoard[0][1].state).toBe(CellState.Flagged);
  });
});

describe('toggleFlag', () => {
  it('toggles flag state on hidden cells', () => {
    const board = createBoardWithMines(3, 3, []);

    const flagged = toggleFlag(board, 1, 1);
    expect(flagged[1][1].state).toBe(CellState.Flagged);

    const unflagged = toggleFlag(flagged, 1, 1);
    expect(unflagged[1][1].state).toBe(CellState.Hidden);
  });

  it('does not modify revealed cells', () => {
    const board = createBoardWithMines(3, 3, []);
    board[1][1].state = CellState.Revealed;

    const newBoard = toggleFlag(board, 1, 1);
    expect(newBoard[1][1].state).toBe(CellState.Revealed);
  });
});

describe('chordReveal', () => {
  it('reveals adjacent cells when flag count matches', () => {
    const board = createBoardWithMines(3, 3, [[0, 0]]);
    board[1][1].state = CellState.Revealed;
    board[0][0].state = CellState.Flagged;

    const result = chordReveal(board, 1, 1);

    expect(result.hitMine).toBe(false);
    expect(result.board[0][1].state).toBe(CellState.Revealed);
    expect(result.board[1][0].state).toBe(CellState.Revealed);
  });

  it('does not reveal when flag count does not match', () => {
    const board = createBoardWithMines(3, 3, [[0, 0]]);
    board[1][1].state = CellState.Revealed;
    // No flags placed

    const result = chordReveal(board, 1, 1);
    expect(result.board[0][1].state).toBe(CellState.Hidden);
  });

  it('returns hitMine true when flag is misplaced', () => {
    const board = createBoardWithMines(3, 3, [[0, 0]]);
    board[1][1].state = CellState.Revealed;
    board[0][1].state = CellState.Flagged; // Wrong position

    const result = chordReveal(board, 1, 1);
    expect(result.hitMine).toBe(true);
  });
});

describe('checkWin', () => {
  it('returns true only when all non-mine cells are revealed', () => {
    const board = createBoardWithMines(3, 3, [[1, 1]]);

    // Not won yet
    board[0][0].state = CellState.Revealed;
    expect(checkWin(board)).toBe(false);

    // Reveal all non-mine cells
    for (const row of board) {
      for (const cell of row) {
        if (!cell.isMine) cell.state = CellState.Revealed;
      }
    }
    expect(checkWin(board)).toBe(true);
  });
});
