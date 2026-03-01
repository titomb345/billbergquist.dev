import type { PieceType, RotationState, ActivePiece, Board } from '../types';
import {
  PIECE_SHAPES,
  BOARD_COLS,
  TOTAL_ROWS,
  SPAWN_COL,
  SPAWN_ROW,
  ALL_PIECES,
  getWallKicks,
} from '../constants';

/** Get the occupied cell positions for a piece in world coordinates */
export function getPieceCells(piece: ActivePiece): [number, number][] {
  const shape = PIECE_SHAPES[piece.type][piece.rotation];
  return shape.map(([r, c]) => [
    piece.position.row + r,
    piece.position.col + c,
  ]);
}

/** Check if a piece position is valid (in bounds and not overlapping locked cells) */
export function isValidPosition(
  board: Board,
  type: PieceType,
  row: number,
  col: number,
  rotation: RotationState,
): boolean {
  const shape = PIECE_SHAPES[type][rotation];
  for (const [dr, dc] of shape) {
    const r = row + dr;
    const c = col + dc;
    if (c < 0 || c >= BOARD_COLS || r >= TOTAL_ROWS) return false;
    if (r < 0) continue; // Above the board is fine
    if (board[r][c] !== null) return false;
  }
  return true;
}

/** Try to move a piece. Returns new piece if valid, null if blocked. */
export function tryMove(
  board: Board,
  piece: ActivePiece,
  dRow: number,
  dCol: number,
): ActivePiece | null {
  const newRow = piece.position.row + dRow;
  const newCol = piece.position.col + dCol;
  if (isValidPosition(board, piece.type, newRow, newCol, piece.rotation)) {
    return { ...piece, position: { row: newRow, col: newCol } };
  }
  return null;
}

/** Try to rotate a piece with SRS wall kicks. Returns new piece if valid, null if blocked. */
export function tryRotate(
  board: Board,
  piece: ActivePiece,
  direction: 1 | -1,
): ActivePiece | null {
  const newRotation = (((piece.rotation + direction) % 4) + 4) % 4 as RotationState;

  // Try base rotation first
  if (isValidPosition(board, piece.type, piece.position.row, piece.position.col, newRotation)) {
    return { ...piece, rotation: newRotation };
  }

  // Try wall kicks
  const kicks = getWallKicks(piece.type, piece.rotation, newRotation);
  for (const [dCol, dRow] of kicks) {
    // SRS kick offsets: positive X = right, positive Y = up (we negate Y for our row system)
    const newRow = piece.position.row - dRow;
    const newCol = piece.position.col + dCol;
    if (isValidPosition(board, piece.type, newRow, newCol, newRotation)) {
      return { ...piece, rotation: newRotation, position: { row: newRow, col: newCol } };
    }
  }

  return null;
}

/** Check if a piece is grounded (can't move down) */
export function isGrounded(board: Board, piece: ActivePiece): boolean {
  return tryMove(board, piece, 1, 0) === null;
}

/** Get the ghost piece Y position (lowest valid row) */
export function getGhostY(board: Board, piece: ActivePiece): number {
  let ghostRow = piece.position.row;
  while (isValidPosition(board, piece.type, ghostRow + 1, piece.position.col, piece.rotation)) {
    ghostRow++;
  }
  return ghostRow;
}

/** Create a new piece at the spawn position */
export function spawnPiece(type: PieceType): ActivePiece {
  return {
    type,
    position: { row: SPAWN_ROW, col: SPAWN_COL },
    rotation: 0,
  };
}

/** Check if a newly spawned piece can fit (game over check) */
export function canSpawn(board: Board, type: PieceType): boolean {
  return isValidPosition(board, type, SPAWN_ROW, SPAWN_COL, 0);
}

/** Generate a shuffled bag of all 7 pieces */
export function generateBag(): PieceType[] {
  const bag = [...ALL_PIECES];
  // Fisher-Yates shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/** Pull the next piece from the bag, refilling if needed. Returns [piece, remainingBag]. */
export function pullFromBag(bag: PieceType[]): [PieceType, PieceType[]] {
  if (bag.length <= 1) {
    const newBag = [...bag, ...generateBag()];
    return [newBag[0], newBag.slice(1)];
  }
  return [bag[0], bag.slice(1)];
}
