import { memo } from 'react';
import { Cell as CellType, CellState } from '../types';
import { MineIcon, FlagIcon } from './icons';

interface CellProps {
  cell: CellType;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
  gameOver: boolean;
  hasDanger?: boolean; // For Danger Sense power-up
  hasPatternMemory?: boolean; // For Pattern Memory power-up (safe diagonal glow)
  xRayMode?: boolean; // For X-Ray Vision targeting
  peekMode?: boolean; // For Peek targeting
  safePathMode?: boolean; // For Safe Path targeting
  defusalKitMode?: boolean; // For Defusal Kit targeting
  surveyMode?: boolean; // For Survey targeting
  mineDetectorMode?: boolean; // For Mine Detector scan targeting
  peekValue?: number | 'mine' | null; // The peeked value to display
  mineDetectorResultValue?: number | null; // Mine Detector scan result for this cell
  onXRay?: (row: number, col: number) => void;
  onPeek?: (row: number, col: number) => void;
  onSafePath?: (row: number, col: number) => void;
  onDefusalKit?: (row: number, col: number) => void;
  onSurvey?: (row: number, col: number) => void;
  onMineDetector?: (row: number, col: number) => void;
  isMineDetectorScanned?: boolean; // This cell was already scanned this floor
  isSurveyAlreadyDone?: boolean; // This cell's row was already surveyed this floor
  onHover?: (row: number, col: number) => void; // For Mine Detector
  onHoverEnd?: () => void; // For Mine Detector
  inDetectorZone?: boolean; // For Mine Detector visual overlay
  isChordHighlighted?: boolean; // For chord highlight preview
  onChordHighlightStart?: (row: number, col: number) => void;
  onChordHighlightEnd?: () => void;
  isFaded?: boolean; // A4: Amnesia - number has faded
  hoveredRow?: number | null; // For Safe Path / Survey row highlighting
  onRowHover?: (row: number | null) => void; // For Safe Path / Survey row highlighting
  hasProbabilityLens?: boolean; // Probability Lens: this cell is one of the safest
  hasOracleGift?: boolean; // Oracle's Gift: this cell is the safe choice in a 50/50
  hasOpeningsMap?: boolean; // Openings Map: this cell is near an open region
}

function CellComponent({
  cell,
  onReveal,
  onFlag,
  onChord,
  gameOver,
  hasDanger = false,
  hasPatternMemory = false,
  xRayMode = false,
  peekMode = false,
  safePathMode = false,
  defusalKitMode = false,
  surveyMode = false,
  mineDetectorMode = false,
  peekValue = null,
  mineDetectorResultValue = null,
  onXRay,
  onPeek,
  onSafePath,
  onDefusalKit,
  onSurvey,
  onMineDetector,
  isMineDetectorScanned = false,
  isSurveyAlreadyDone = false,
  onHover,
  onHoverEnd,
  inDetectorZone = false,
  isChordHighlighted = false,
  onChordHighlightStart,
  onChordHighlightEnd,
  isFaded = false,
  hoveredRow = null,
  onRowHover,
  hasProbabilityLens = false,
  hasOracleGift = false,
  hasOpeningsMap = false,
}: CellProps) {
  const isTargeting =
    xRayMode || peekMode || safePathMode || defusalKitMode || surveyMode || mineDetectorMode;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver) return;

    // X-Ray mode takes precedence
    if (xRayMode && onXRay) {
      onXRay(cell.row, cell.col);
      return;
    }

    // Peek mode
    if (peekMode && onPeek && cell.state === CellState.Hidden) {
      onPeek(cell.row, cell.col);
      return;
    }

    // Safe Path mode - works on hidden cells
    if (safePathMode && onSafePath && cell.state === CellState.Hidden) {
      onSafePath(cell.row, cell.col);
      return;
    }

    // Defusal Kit mode - works on flagged cells
    if (defusalKitMode && onDefusalKit && cell.state === CellState.Flagged) {
      onDefusalKit(cell.row, cell.col);
      return;
    }

    // Mine Detector mode - works on hidden cells that haven't been scanned yet
    if (mineDetectorMode && onMineDetector && cell.state === CellState.Hidden) {
      if (isMineDetectorScanned) return; // Already scanned, do nothing
      onMineDetector(cell.row, cell.col);
      return;
    }

    // Survey mode - works on hidden cells in unsurveyed rows
    if (surveyMode && onSurvey && cell.state === CellState.Hidden) {
      if (isSurveyAlreadyDone) return; // Already surveyed, do nothing
      onSurvey(cell.row, cell.col);
      return;
    }

    // Block normal reveal/chord when a power-up targeting mode is active
    if (isTargeting) return;

    if (cell.state === CellState.Revealed && cell.adjacentMines > 0) {
      onChord(cell.row, cell.col);
    } else if (cell.state === CellState.Hidden) {
      onReveal(cell.row, cell.col);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver) return;
    if (isTargeting) return;
    onFlag(cell.row, cell.col);
  };

  const getClassName = () => {
    const classes = ['cell'];

    if (cell.state === CellState.Hidden) {
      classes.push('cell-hidden');
      if (hasDanger) {
        classes.push('cell-danger');
      }
      if (hasPatternMemory) {
        classes.push('cell-pattern-memory');
      }
      if (hasProbabilityLens) {
        classes.push('cell-probability-lens');
      }
      if (hasOracleGift) {
        classes.push('cell-oracle-gift');
      }
      if (hasOpeningsMap) {
        classes.push('cell-openings-map');
      }
      if (xRayMode) {
        classes.push('cell-xray-target');
      }
      if (peekMode) {
        classes.push('cell-peek-target');
      }
      if (safePathMode && hoveredRow === cell.row) {
        classes.push('cell-row-highlight-green');
      }
      if (surveyMode && hoveredRow === cell.row && !isSurveyAlreadyDone) {
        classes.push('cell-row-highlight-yellow');
      }
      if (surveyMode && isSurveyAlreadyDone) {
        classes.push('cell-survey-already-done');
      }
      if (mineDetectorMode && !isMineDetectorScanned) {
        classes.push('cell-detector-target');
      }
      if (mineDetectorMode && isMineDetectorScanned) {
        classes.push('cell-detector-already-scanned');
      }
      if (mineDetectorResultValue !== null) {
        classes.push('cell-detector-scanned');
      }
      if (peekValue !== null) {
        classes.push('cell-peeked');
      }
      if (inDetectorZone) {
        classes.push('cell-detector-zone');
      }
      if (isChordHighlighted) {
        classes.push('cell-chord-highlight');
      }
    } else if (cell.state === CellState.Flagged) {
      classes.push('cell-flagged');
      if (defusalKitMode) {
        classes.push('cell-defusal-target');
      }
      if (inDetectorZone) {
        classes.push('cell-detector-zone');
      }
      if (isChordHighlighted) {
        classes.push('cell-chord-highlight');
      }
    } else if (cell.state === CellState.Revealed) {
      classes.push('cell-revealed');
      if (cell.isMine) {
        classes.push('cell-mine');
      } else if (cell.adjacentMines > 0) {
        classes.push(`cell-${cell.adjacentMines}`);
        // A4: Faded cell styling
        if (isFaded) {
          classes.push('cell-faded');
        }
      }
    }

    return classes.join(' ');
  };

  const getContent = () => {
    // Show mine detector scan result
    if (mineDetectorResultValue !== null && cell.state === CellState.Hidden) {
      return <span className="detector-scan-number">{mineDetectorResultValue}</span>;
    }

    // Show peek value if this cell is being peeked
    if (peekValue !== null && cell.state === CellState.Hidden) {
      if (peekValue === 'mine') {
        return <MineIcon />;
      }
      if (peekValue > 0) {
        return <span className={`peek-number cell-${peekValue}`}>{peekValue}</span>;
      }
      return <span className="peek-number">0</span>;
    }

    if (cell.state === CellState.Flagged) {
      return <FlagIcon />;
    }
    if (cell.state === CellState.Revealed) {
      if (cell.isMine) {
        return <MineIcon />;
      }
      if (cell.adjacentMines > 0) {
        // A4: Show "?" for faded cells
        if (isFaded) {
          return <span className="faded-number">?</span>;
        }
        return cell.adjacentMines;
      }
    }
    return null;
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Row hover for Safe Path / Survey
    onRowHover?.(cell.row);

    if (onHover && cell.state === CellState.Hidden) {
      onHover(cell.row, cell.col);
    }

    // If mouse button is held and entering a revealed numbered cell, show chord highlight
    if (e.buttons > 0 && !gameOver) {
      if (onChordHighlightStart && cell.state === CellState.Revealed && cell.adjacentMines > 0) {
        onChordHighlightStart(cell.row, cell.col);
      } else if (onChordHighlightEnd) {
        // Clear highlight when moving to a non-chordable cell while button held
        onChordHighlightEnd();
      }
    }
  };

  const handleMouseLeave = () => {
    // Clear row hover for Safe Path / Survey
    onRowHover?.(null);

    if (onHoverEnd) {
      onHoverEnd();
    }
    if (onChordHighlightEnd) {
      onChordHighlightEnd();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Handle middle-click for chord
    if (e.button === 1) {
      e.preventDefault();
      if (gameOver) return;
      if (isTargeting) return;
      if (cell.state === CellState.Revealed && cell.adjacentMines > 0) {
        onChord(cell.row, cell.col);
      }
      return;
    }

    // Show chord highlight on mousedown for revealed numbered cells
    if (
      onChordHighlightStart &&
      cell.state === CellState.Revealed &&
      cell.adjacentMines > 0 &&
      !gameOver
    ) {
      onChordHighlightStart(cell.row, cell.col);
    }
  };

  const handleMouseUp = () => {
    if (onChordHighlightEnd) {
      onChordHighlightEnd();
    }
  };

  return (
    <div
      className={getClassName()}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {getContent()}
    </div>
  );
}

// Memoize Cell to prevent re-renders when props haven't changed
// On a 12x12 board, this prevents 144 unnecessary re-renders per state change
// Note: Callback props (onReveal, onFlag, onChord, onXRay, onHover, onHoverEnd,
// onChordHighlightStart, onChordHighlightEnd) are assumed stable via useCallback
// in parent - not compared here for performance
const Cell = memo(CellComponent, (prev, next) => {
  return (
    prev.cell.state === next.cell.state &&
    prev.cell.adjacentMines === next.cell.adjacentMines &&
    prev.cell.isMine === next.cell.isMine &&
    prev.gameOver === next.gameOver &&
    prev.hasDanger === next.hasDanger &&
    prev.hasPatternMemory === next.hasPatternMemory &&
    prev.xRayMode === next.xRayMode &&
    prev.peekMode === next.peekMode &&
    prev.safePathMode === next.safePathMode &&
    prev.defusalKitMode === next.defusalKitMode &&
    prev.surveyMode === next.surveyMode &&
    prev.mineDetectorMode === next.mineDetectorMode &&
    prev.isMineDetectorScanned === next.isMineDetectorScanned &&
    prev.isSurveyAlreadyDone === next.isSurveyAlreadyDone &&
    prev.peekValue === next.peekValue &&
    prev.mineDetectorResultValue === next.mineDetectorResultValue &&
    prev.inDetectorZone === next.inDetectorZone &&
    prev.isChordHighlighted === next.isChordHighlighted &&
    prev.isFaded === next.isFaded &&
    prev.hoveredRow === next.hoveredRow &&
    prev.hasProbabilityLens === next.hasProbabilityLens &&
    prev.hasOracleGift === next.hasOracleGift &&
    prev.hasOpeningsMap === next.hasOpeningsMap
  );
});

export default Cell;
