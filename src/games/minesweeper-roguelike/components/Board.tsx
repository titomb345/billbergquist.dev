import { useState } from 'react';
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
  surveyedRows?: Map<number, number>;
  mineDetectorMode?: boolean;
  onSurvey?: (row: number, col: number) => void;
  onMineDetector?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellHoverEnd?: () => void;
  detectorCenter?: { row: number; col: number } | null;
  mineDetectorResult?: { row: number; col: number; count: number } | null;
  mineDetectorScannedCells?: Set<string>;
  chordHighlightCells?: Set<string>;
  onChordHighlightStart?: (row: number, col: number) => void;
  onChordHighlightEnd?: () => void;
  fadedCells?: Set<string>; // A4: Cells with faded numbers
  probabilityLensCells?: Set<string>; // Probability Lens: safest cells highlighted
  oracleGiftCells?: Set<string>; // Oracle's Gift: 50/50 safe cells highlighted
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
  surveyedRows,
  mineDetectorMode = false,
  peekCell,
  mineDetectorResult,
  onXRay,
  onPeek,
  onSafePath,
  onDefusalKit,
  onSurvey,
  onMineDetector,
  onCellHover,
  onCellHoverEnd,
  detectorCenter,
  mineDetectorScannedCells,
  chordHighlightCells,
  onChordHighlightStart,
  onChordHighlightEnd,
  fadedCells,
  probabilityLensCells,
  oracleGiftCells,
}: BoardProps) {
  // Track hovered row for Safe Path and Survey row highlighting
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Check if a cell is within the 4x4 detector zone (offsets -1 to +2)
  const isInDetectorZone = (row: number, col: number): boolean => {
    if (!detectorCenter) return false;
    const rowDiff = row - detectorCenter.row;
    const colDiff = col - detectorCenter.col;
    return rowDiff >= -1 && rowDiff <= 2 && colDiff >= -1 && colDiff <= 2;
  };

  // Show row markers when survey mode is active OR when there are surveyed rows to display
  const showRowMarkers = surveyMode || (surveyedRows && surveyedRows.size > 0);

  return (
    <div
      className={`minesweeper-board ${xRayMode ? 'xray-mode' : ''} ${showRowMarkers ? 'has-survey-markers' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {showRowMarkers && (() => {
            const isSurveyed = surveyedRows?.has(rowIndex);
            const mineCount = surveyedRows?.get(rowIndex);
            const isHovered = surveyMode && hoveredRow === rowIndex && !isSurveyed;
            // When not in survey mode, only render markers for surveyed rows
            if (!surveyMode && !isSurveyed) {
              return <div className="survey-row-marker placeholder" />;
            }
            return (
              <div
                className={`survey-row-marker ${isSurveyed ? 'surveyed' : ''} ${surveyMode && !isSurveyed ? 'active' : ''} ${surveyMode && isSurveyed ? 'surveyed-targeting' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => {
                  if (surveyMode && !isSurveyed && onSurvey) {
                    onSurvey(rowIndex, 0);
                  }
                }}
                onMouseEnter={() => {
                  if (surveyMode && !isSurveyed) {
                    setHoveredRow(rowIndex);
                  }
                }}
                onMouseLeave={() => {
                  if (surveyMode) {
                    setHoveredRow(null);
                  }
                }}
              >
                {isSurveyed ? (
                  <span className="survey-badge-result">
                    <span className="survey-badge-mine">💣</span>
                    <span className="survey-badge-count">{mineCount}</span>
                  </span>
                ) : (
                  <span className="survey-marker-dot">▶</span>
                )}
              </div>
            );
          })()}
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
              mineDetectorMode={mineDetectorMode}
              peekValue={
                peekCell?.row === cell.row && peekCell?.col === cell.col ? peekCell.value : null
              }
              mineDetectorResultValue={
                mineDetectorResult?.row === cell.row && mineDetectorResult?.col === cell.col
                  ? mineDetectorResult.count
                  : null
              }
              onXRay={onXRay}
              onPeek={onPeek}
              onSafePath={onSafePath}
              onDefusalKit={onDefusalKit}
              onSurvey={onSurvey}
              onMineDetector={onMineDetector}
              isSurveyAlreadyDone={surveyMode && (surveyedRows?.has(cell.row) ?? false)}
              isMineDetectorScanned={mineDetectorScannedCells?.has(`${cell.row},${cell.col}`)}
              onHover={onCellHover}
              onHoverEnd={onCellHoverEnd}
              inDetectorZone={isInDetectorZone(cell.row, cell.col)}
              isChordHighlighted={chordHighlightCells?.has(`${cell.row},${cell.col}`)}
              onChordHighlightStart={onChordHighlightStart}
              onChordHighlightEnd={onChordHighlightEnd}
              isFaded={fadedCells?.has(`${cell.row},${cell.col}`)}
              hoveredRow={safePathMode || surveyMode ? hoveredRow : null}
              onRowHover={safePathMode || surveyMode ? setHoveredRow : undefined}
              hasProbabilityLens={probabilityLensCells?.has(`${cell.row},${cell.col}`)}
              hasOracleGift={oracleGiftCells?.has(`${cell.row},${cell.col}`)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Board;
