import type { Board, ActivePiece, CellValue } from '../types';
import { BOARD_COLS, TOTAL_ROWS, BUFFER_ROWS } from '../constants';
import { getPieceCells } from './pieceLogic';

/** Create an empty board */
export function createEmptyBoard(): Board {
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array.from<CellValue>({ length: BOARD_COLS }).fill(null),
  );
}

/** Lock a piece onto the board, returning the new board */
export function lockPiece(board: Board, piece: ActivePiece): Board {
  const newBoard = board.map((row) => [...row]);
  const cells = getPieceCells(piece);
  for (const [r, c] of cells) {
    if (r >= 0 && r < TOTAL_ROWS && c >= 0 && c < BOARD_COLS) {
      newBoard[r][c] = piece.type;
    }
  }
  return newBoard;
}

/** Find all completed lines (full rows). Returns row indices sorted ascending. */
export function findCompletedLines(board: Board): number[] {
  const completed: number[] = [];
  for (let r = BUFFER_ROWS; r < TOTAL_ROWS; r++) {
    if (board[r].every((cell) => cell !== null)) {
      completed.push(r);
    }
  }
  return completed;
}

/** Clear the specified lines and shift rows down. Returns the new board. */
export function clearLines(board: Board, lines: number[]): Board {
  if (lines.length === 0) return board;

  const lineSet = new Set(lines);
  // Keep rows that aren't being cleared
  const remaining = board.filter((_, idx) => !lineSet.has(idx));
  // Add empty rows at the top to replace cleared lines
  const emptyRows = Array.from({ length: lines.length }, () =>
    Array.from<CellValue>({ length: BOARD_COLS }).fill(null),
  );
  return [...emptyRows, ...remaining];
}

/** Check if any blocks are above the visible area (lock out condition) */
export function isLockedOut(board: Board): boolean {
  for (let r = 0; r < BUFFER_ROWS; r++) {
    if (board[r].some((cell) => cell !== null)) {
      return true;
    }
  }
  return false;
}

/**
 * Get the visible portion of the board (rows BUFFER_ROWS to TOTAL_ROWS).
 * Returns a 20-row board for rendering.
 */
export function getVisibleBoard(board: Board): Board {
  return board.slice(BUFFER_ROWS);
}
