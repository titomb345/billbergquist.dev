import { Cell as CellType } from '../types';
import Cell from './Cell';

interface BoardProps {
  board: CellType[][];
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
  gameOver: boolean;
  dangerCells?: Set<string>;
  patternMemoryCells?: Set<string>;
  heatMapEnabled?: boolean;
  xRayMode?: boolean;
  peekMode?: boolean;
  safePathMode?: boolean;
  defusalKitMode?: boolean;
  peekCell?: { row: number; col: number; value: number | 'mine' } | null;
  onXRay?: (row: number, col: number) => void;
  onPeek?: (row: number, col: number) => void;
  onSafePath?: (row: number, col: number) => void;
  onDefusalKit?: (row: number, col: number) => void;
  surveyMode?: boolean;
  onSurvey?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellHoverEnd?: () => void;
  detectorCenter?: { row: number; col: number } | null;
  chordHighlightCells?: Set<string>;
  onChordHighlightStart?: (row: number, col: number) => void;
  onChordHighlightEnd?: () => void;
  fadedCells?: Set<string>; // A4: Cells with faded numbers
}

function Board({
  board,
  onReveal,
  onFlag,
  onChord,
  gameOver,
  dangerCells,
  patternMemoryCells,
  heatMapEnabled = false,
  xRayMode = false,
  peekMode = false,
  safePathMode = false,
  defusalKitMode = false,
  surveyMode = false,
  peekCell,
  onXRay,
  onPeek,
  onSafePath,
  onDefusalKit,
  onSurvey,
  onCellHover,
  onCellHoverEnd,
  detectorCenter,
  chordHighlightCells,
  onChordHighlightStart,
  onChordHighlightEnd,
  fadedCells,
}: BoardProps) {
  // Check if a cell is within the 5x5 detector zone
  const isInDetectorZone = (row: number, col: number): boolean => {
    if (!detectorCenter) return false;
    const rowDiff = Math.abs(row - detectorCenter.row);
    const colDiff = Math.abs(col - detectorCenter.col);
    return rowDiff <= 2 && colDiff <= 2;
  };

  return (
    <div
      className={`minesweeper-board ${xRayMode ? 'xray-mode' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell) => (
            <Cell
              key={`${cell.row}-${cell.col}`}
              cell={cell}
              onReveal={onReveal}
              onFlag={onFlag}
              onChord={onChord}
              gameOver={gameOver}
              hasDanger={dangerCells?.has(`${cell.row},${cell.col}`)}
              hasPatternMemory={patternMemoryCells?.has(`${cell.row},${cell.col}`)}
              heatMapEnabled={heatMapEnabled}
              xRayMode={xRayMode}
              peekMode={peekMode}
              safePathMode={safePathMode}
              defusalKitMode={defusalKitMode}
              surveyMode={surveyMode}
              peekValue={
                peekCell?.row === cell.row && peekCell?.col === cell.col
                  ? peekCell.value
                  : null
              }
              onXRay={onXRay}
              onPeek={onPeek}
              onSafePath={onSafePath}
              onDefusalKit={onDefusalKit}
              onSurvey={onSurvey}
              onHover={onCellHover}
              onHoverEnd={onCellHoverEnd}
              inDetectorZone={isInDetectorZone(cell.row, cell.col)}
              isChordHighlighted={chordHighlightCells?.has(`${cell.row},${cell.col}`)}
              onChordHighlightStart={onChordHighlightStart}
              onChordHighlightEnd={onChordHighlightEnd}
              isFaded={fadedCells?.has(`${cell.row},${cell.col}`)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Board;
