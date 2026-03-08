import { useState, useMemo } from 'react';
import type { Cell as CellType } from '../types';
import Cell from './Cell';

interface BoardProps {
  board: CellType[][];
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
  gameOver: boolean;
  dangerCells?: Set<string>;
  patternMemoryCells?: Set<string>;
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
  openingsMapCells?: Set<string>; // Openings Map: cells near open regions
}

function Board({
  board,
  onReveal,
  onFlag,
  onChord,
  gameOver,
  dangerCells,
  patternMemoryCells,
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
  openingsMapCells,
}: BoardProps) {
  // Track hovered row for Safe Path and Survey row highlighting
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Pre-compute detector zone as a Set for O(1) lookups instead of per-cell bounds checks
  const detectorZone = useMemo(() => {
    if (!detectorCenter) return null;
    const zone = new Set<string>();
    for (let r = detectorCenter.row - 1; r <= detectorCenter.row + 2; r++) {
      for (let c = detectorCenter.col - 1; c <= detectorCenter.col + 2; c++) {
        zone.add(`${r},${c}`);
      }
    }
    return zone;
  }, [detectorCenter]);

  // Show row markers when survey mode is active OR when there are surveyed rows to display
  const showRowMarkers = surveyMode || (surveyedRows && surveyedRows.size > 0);
  const rowHoverMode = safePathMode || surveyMode;

  return (
    <div
      className={`minesweeper-board ${xRayMode ? 'xray-mode' : ''} ${showRowMarkers ? 'has-survey-markers' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {board.map((row, rowIndex) => {
        // Per-row: compute survey state once (shared by all cells in this row)
        const rowSurveyed = surveyedRows?.has(rowIndex) ?? false;
        const rowMineCount = surveyedRows?.get(rowIndex);

        return (
        <div key={rowIndex} className="board-row">
          {showRowMarkers && (() => {
            const isHovered = surveyMode && hoveredRow === rowIndex && !rowSurveyed;
            if (!surveyMode && !rowSurveyed) {
              return <div className="survey-row-marker placeholder" />;
            }
            return (
              <div
                className={`survey-row-marker ${rowSurveyed ? 'surveyed' : ''} ${surveyMode && !rowSurveyed ? 'active' : ''} ${surveyMode && rowSurveyed ? 'surveyed-targeting' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => {
                  if (surveyMode && !rowSurveyed && onSurvey) {
                    onSurvey(rowIndex, 0);
                  }
                }}
                onMouseEnter={() => {
                  if (surveyMode && !rowSurveyed) {
                    setHoveredRow(rowIndex);
                  }
                }}
                onMouseLeave={() => {
                  if (surveyMode) {
                    setHoveredRow(null);
                  }
                }}
              >
                {rowSurveyed ? (
                  <span className="survey-badge-result">
                    <span className="survey-badge-mine">💣</span>
                    <span className="survey-badge-count">{rowMineCount}</span>
                  </span>
                ) : (
                  <span className="survey-marker-dot">▶</span>
                )}
              </div>
            );
          })()}
          {row.map((cell) => {
            // Cache cellKey once instead of computing 9 times per cell
            const cellKey = `${cell.row},${cell.col}`;
            return (
            <Cell
              key={`${cell.row}-${cell.col}`}
              cell={cell}
              onReveal={onReveal}
              onFlag={onFlag}
              onChord={onChord}
              gameOver={gameOver}
              hasDanger={dangerCells?.has(cellKey)}
              hasPatternMemory={patternMemoryCells?.has(cellKey)}
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
              isSurveyAlreadyDone={surveyMode && rowSurveyed}
              isMineDetectorScanned={mineDetectorScannedCells?.has(cellKey)}
              onHover={onCellHover}
              onHoverEnd={onCellHoverEnd}
              inDetectorZone={detectorZone?.has(cellKey) ?? false}
              isChordHighlighted={chordHighlightCells?.has(cellKey)}
              onChordHighlightStart={onChordHighlightStart}
              onChordHighlightEnd={onChordHighlightEnd}
              isFaded={fadedCells?.has(cellKey)}
              hoveredRow={rowHoverMode ? hoveredRow : null}
              onRowHover={rowHoverMode ? setHoveredRow : undefined}
              hasProbabilityLens={probabilityLensCells?.has(cellKey)}
              hasOracleGift={oracleGiftCells?.has(cellKey)}
              hasOpeningsMap={openingsMapCells?.has(cellKey)}
            />
            );
          })}
        </div>
        );
      })}
    </div>
  );
}

export default Board;
