import type { Board as BoardType, ActivePiece } from '../types';
import { BUFFER_ROWS, PIECE_SHAPES } from '../constants';
import Cell from './Cell';
import '../styles.css';

interface BoardProps {
  board: BoardType;
  activePiece: ActivePiece | null;
  ghostY: number;
  clearingLines: number[];
}

function Board({ board, activePiece, ghostY, clearingLines }: BoardProps) {
  // Build a lookup for active piece cells and ghost cells
  const activeCells = new Set<string>();
  const ghostCells = new Set<string>();
  const clearingSet = new Set(clearingLines);

  if (activePiece) {
    const shape = PIECE_SHAPES[activePiece.type][activePiece.rotation];
    for (const [dr, dc] of shape) {
      const r = activePiece.position.row + dr;
      const c = activePiece.position.col + dc;
      if (r >= BUFFER_ROWS) {
        activeCells.add(`${r},${c}`);
      }

      // Ghost
      const gr = ghostY + dr;
      if (gr >= BUFFER_ROWS) {
        ghostCells.add(`${gr},${dc + activePiece.position.col}`);
      }
    }
  }

  // Render only visible rows (BUFFER_ROWS onward)
  const cells: React.ReactNode[] = [];
  for (let r = BUFFER_ROWS; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const key = `${r},${c}`;
      const isClearing = clearingSet.has(r);
      const isActive = activeCells.has(key);
      const isGhost = !isActive && ghostCells.has(key) && !board[r][c];

      let value = board[r][c];
      if (isActive && activePiece) {
        value = activePiece.type;
      }

      cells.push(
        <Cell
          key={key}
          value={value}
          isGhost={isGhost}
          isClearing={isClearing}
        />,
      );
    }
  }

  return <div className="board">{cells}</div>;
}

export default Board;
