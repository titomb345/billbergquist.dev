import { Cell, CellState, DifficultyConfig, FloorConfig } from '../types';

export function createEmptyBoard(config: DifficultyConfig): Cell[][] {
  const board: Cell[][] = [];
  for (let row = 0; row < config.rows; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < config.cols; col++) {
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

export function placeMines(
  board: Cell[][],
  config: DifficultyConfig,
  excludeRow: number,
  excludeCol: number,
  toroidal: boolean = false
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const excludeSet = new Set<string>();

  // Exclude the clicked cell and its neighbors
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = excludeRow + dr;
      const c = excludeCol + dc;
      if (r >= 0 && r < config.rows && c >= 0 && c < config.cols) {
        excludeSet.add(`${r},${c}`);
      }
    }
  }

  // Get all valid positions for mines
  const validPositions: [number, number][] = [];
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      if (!excludeSet.has(`${row},${col}`)) {
        validPositions.push([row, col]);
      }
    }
  }

  // Shuffle and pick mine positions
  for (let i = validPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
  }

  const minePositions = validPositions.slice(0, config.mines);
  for (const [row, col] of minePositions) {
    newBoard[row][col].isMine = true;
  }

  return calculateAdjacentMines(newBoard, toroidal);
}

// Helper: wrap coordinate for toroidal mode
function wrap(val: number, max: number): number {
  return ((val % max) + max) % max;
}

export function calculateAdjacentMines(board: Cell[][], toroidal: boolean = false): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].isMine) continue;

      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;

          let r = row + dr;
          let c = col + dc;

          if (toroidal) {
            // A5: Wrap coordinates at edges
            r = wrap(r, rows);
            c = wrap(c, cols);
            if (board[r][c].isMine) {
              count++;
            }
          } else {
            // Normal bounds checking
            if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].isMine) {
              count++;
            }
          }
        }
      }
      board[row][col].adjacentMines = count;
    }
  }

  return board;
}

export function revealCell(board: Cell[][], row: number, col: number): Cell[][] {
  const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));
  const cell = newBoard[row][col];

  if (cell.state !== CellState.Hidden) return newBoard;

  cell.state = CellState.Revealed;

  // If it's a mine, just reveal it
  if (cell.isMine) return newBoard;

  // If it has no adjacent mines, cascade reveal
  if (cell.adjacentMines === 0) {
    return revealCascade(newBoard, row, col);
  }

  return newBoard;
}

export function revealCascade(board: Cell[][], startRow: number, startCol: number): Cell[][] {
  const rows = board.length;
  const cols = board[0].length;
  const stack: [number, number][] = [[startRow, startCol]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [row, col] = stack.pop()!;
    const key = `${row},${col}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = board[row][col];
    if (cell.state === CellState.Flagged || cell.isMine) continue;

    cell.state = CellState.Revealed;

    // Only continue cascading if this cell has no adjacent mines
    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].state === CellState.Hidden) {
            stack.push([r, c]);
          }
        }
      }
    }
  }

  return board;
}

export function toggleFlag(board: Cell[][], row: number, col: number): Cell[][] {
  const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));
  const cell = newBoard[row][col];

  if (cell.state === CellState.Revealed) return newBoard;

  cell.state = cell.state === CellState.Flagged ? CellState.Hidden : CellState.Flagged;
  return newBoard;
}

export function chordReveal(
  board: Cell[][],
  row: number,
  col: number
): { board: Cell[][]; hitMine: boolean } {
  const cell = board[row][col];

  // Only works on revealed cells with a number
  if (cell.state !== CellState.Revealed || cell.adjacentMines === 0) {
    return { board, hitMine: false };
  }

  const rows = board.length;
  const cols = board[0].length;

  // Count adjacent flags
  let flagCount = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].state === CellState.Flagged) {
        flagCount++;
      }
    }
  }

  // If flag count doesn't match, do nothing
  if (flagCount !== cell.adjacentMines) {
    return { board, hitMine: false };
  }

  // Reveal all adjacent hidden cells
  let newBoard = board.map((r) => r.map((c) => ({ ...c })));
  let hitMine = false;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const adjacentCell = newBoard[r][c];
        if (adjacentCell.state === CellState.Hidden) {
          if (adjacentCell.isMine) {
            hitMine = true;
            adjacentCell.state = CellState.Revealed;
          } else {
            newBoard = revealCell(newBoard, r, c);
          }
        }
      }
    }
  }

  return { board: newBoard, hitMine };
}

export function checkWin(board: Cell[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      // If there's a non-mine cell that's not revealed, game isn't won yet
      if (!cell.isMine && cell.state !== CellState.Revealed) {
        return false;
      }
    }
  }
  return true;
}

export function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      state: cell.isMine ? CellState.Revealed : cell.state,
    }))
  );
}

export function countFlags(board: Cell[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state === CellState.Flagged) count++;
    }
  }
  return count;
}

// Options for power-up constrained mine placement
export interface PlaceMinesOptions {
  cautiousStart?: boolean; // First click cell must have ≤2 adjacent mines
  breathingRoom?: boolean; // 2×2 area around first click must be safe
  toroidal?: boolean; // A5: Wrap coordinates at edges
}

// Place mines with optional power-up constraints
export function placeMinesWithConstraints(
  board: Cell[][],
  config: FloorConfig | DifficultyConfig,
  excludeRow: number,
  excludeCol: number,
  options: PlaceMinesOptions = {}
): Cell[][] {
  const rows = config.rows;
  const cols = config.cols;
  const mines = config.mines;

  // Build the exclusion set based on options
  const excludeSet = new Set<string>();

  if (options.breathingRoom) {
    // Exclude a 2×2 area around the clicked cell (the cell and 3 cells in the best direction)
    // Actually, let's do a 3×3 area to ensure 2×2 is always safe
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = excludeRow + dr;
        const c = excludeCol + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          excludeSet.add(`${r},${c}`);
        }
      }
    }
  } else {
    // Default: exclude clicked cell and its neighbors (3×3)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = excludeRow + dr;
        const c = excludeCol + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          excludeSet.add(`${r},${c}`);
        }
      }
    }
  }

  // Get all valid positions for mines
  const validPositions: [number, number][] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!excludeSet.has(`${row},${col}`)) {
        validPositions.push([row, col]);
      }
    }
  }

  // If Cautious Start is enabled, we need to ensure the clicked cell has ≤2 adjacent mines
  // Try up to 50 times to find a valid configuration
  const maxAttempts = options.cautiousStart ? 50 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell, isMine: false, adjacentMines: 0 })));

    // Shuffle valid positions
    const shuffled = [...validPositions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Place mines
    const minePositions = shuffled.slice(0, mines);
    for (const [row, col] of minePositions) {
      newBoard[row][col].isMine = true;
    }

    // Calculate adjacent mines
    const finalBoard = calculateAdjacentMines(newBoard, options.toroidal ?? false);

    // Check Cautious Start constraint
    if (options.cautiousStart) {
      const clickedCell = finalBoard[excludeRow][excludeCol];
      if (clickedCell.adjacentMines > 2) {
        continue; // Try again
      }
    }

    return finalBoard;
  }

  // Fallback: return the last attempt even if it doesn't meet constraints
  // This should rarely happen with reasonable board/mine configurations
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell, isMine: false, adjacentMines: 0 })));
  const shuffled = [...validPositions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const minePositions = shuffled.slice(0, mines);
  for (const [row, col] of minePositions) {
    newBoard[row][col].isMine = true;
  }
  return calculateAdjacentMines(newBoard, options.toroidal ?? false);
}
