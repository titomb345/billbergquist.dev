import { useRef, useState, useCallback, useEffect, MutableRefObject } from 'react';
import { useRoguelikeState } from './hooks/useRoguelikeState';
import { useContainerWidth } from './hooks/useContainerWidth';
import { useRoguelikeStats } from './hooks/useRoguelikeStats';
import Board from './components/Board';
import RoguelikeHeader from './components/RoguelikeHeader';
import StartScreen from './components/StartScreen';
import PowerUpDraft from './components/PowerUpDraft';
import RunOverScreen from './components/RunOverScreen';
import ExplosionOverlay from './components/ExplosionOverlay';
import FloorClearOverlay from './components/FloorClearOverlay';
import CloseCallOverlay from './components/CloseCallOverlay';
import UnlockSplashScreen from './components/UnlockSplashScreen';
import { isFinalFloor, calculateMineCount5x5 } from './logic/roguelikeLogic';
import { GamePhase, PowerUp } from './types';
import { UNLOCK_FLOOR_5_REWARD, getPowerUpById } from './constants';
import { AscensionLevel } from './ascension';
import './styles.css';

interface MinesweeperProps {
  resetRef?: MutableRefObject<(() => void) | null>;
}

function Minesweeper({ resetRef }: MinesweeperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isConstrained = useContainerWidth(containerRef);
  const { stats, recordRun } = useRoguelikeStats();
  const {
    state,
    startRun,
    goToStart,
    revealCell,
    toggleFlag,
    chordClick,
    useXRay,
    usePeek,
    useSafePath,
    useDefusalKit,
    useSurvey,
    selectPowerUp,
    skipDraft,
    explosionComplete,
    floorClearComplete,
    setChordHighlight,
    clearChordHighlight,
  } = useRoguelikeState(isConstrained, stats.unlocks);

  const [xRayMode, setXRayMode] = useState(false);
  const [peekMode, setPeekMode] = useState(false);
  const [safePathMode, setSafePathMode] = useState(false);
  const [defusalKitMode, setDefusalKitMode] = useState(false);
  const [surveyMode, setSurveyMode] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [pendingUnlock, setPendingUnlock] = useState<PowerUp | null>(null);
  const [unlockShownThisRun, setUnlockShownThisRun] = useState(false);

  // Expose reset function to parent via ref
  useEffect(() => {
    if (resetRef) {
      resetRef.current = goToStart;
    }
    return () => {
      if (resetRef) {
        resetRef.current = null;
      }
    };
  }, [resetRef, goToStart]);

  const handleStartRun = (ascensionLevel: AscensionLevel = 0) => {
    startRun(stats.unlocks, ascensionLevel);
  };

  // Mine Detector: calculate 5×5 mine count when hovering
  const hasMineDetector = state.run.activePowerUps.some((p) => p.id === 'mine-detector');
  const mineDetectorCount =
    hasMineDetector && hoveredCell && !state.isFirstClick
      ? calculateMineCount5x5(state.board, hoveredCell.row, hoveredCell.col)
      : null;

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredCell({ row, col });
  }, []);

  const handleCellHoverEnd = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const handleXRayClick = (row: number, col: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useXRay(row, col);
    setXRayMode(false);
  };

  const handleToggleXRayMode = () => {
    const newMode = !xRayMode;
    clearAllModes();
    setXRayMode(newMode);
  };

  // Check if X-Ray is available
  const hasXRay = state.run.activePowerUps.some((p) => p.id === 'x-ray-vision');
  const canUseXRay = hasXRay && !state.run.xRayUsedThisFloor && !state.isFirstClick;

  // Check if Peek is available
  const hasPeek = state.run.activePowerUps.some((p) => p.id === 'peek');
  const canUsePeek = hasPeek && !state.run.peekUsedThisFloor && !state.isFirstClick;

  // Check if Safe Path is available
  const hasSafePath = state.run.activePowerUps.some((p) => p.id === 'safe-path');
  const canUseSafePath = hasSafePath && !state.run.safePathUsedThisFloor && !state.isFirstClick;

  // Check if Defusal Kit is available
  const hasDefusalKit = state.run.activePowerUps.some((p) => p.id === 'defusal-kit');
  const canUseDefusalKit = hasDefusalKit && !state.run.defusalKitUsedThisFloor && !state.isFirstClick;

  // Check if Survey is available
  const hasSurvey = state.run.activePowerUps.some((p) => p.id === 'survey');
  const canUseSurvey = hasSurvey && !state.run.surveyUsedThisFloor && !state.isFirstClick;

  const clearAllModes = () => {
    setXRayMode(false);
    setPeekMode(false);
    setSafePathMode(false);
    setDefusalKitMode(false);
    setSurveyMode(false);
  };

  const handlePeekClick = (row: number, col: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePeek(row, col);
    setPeekMode(false);
  };

  const handleTogglePeekMode = () => {
    const newMode = !peekMode;
    clearAllModes();
    setPeekMode(newMode);
  };

  const handleSafePathClick = (row: number, _col: number) => {
    // For simplicity, Safe Path reveals cells in the ROW of the clicked cell
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSafePath('row', row);
    setSafePathMode(false);
  };

  const handleToggleSafePathMode = () => {
    const newMode = !safePathMode;
    clearAllModes();
    setSafePathMode(newMode);
  };

  const handleDefusalKitClick = (row: number, col: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDefusalKit(row, col);
    setDefusalKitMode(false);
  };

  const handleToggleDefusalKitMode = () => {
    const newMode = !defusalKitMode;
    clearAllModes();
    setDefusalKitMode(newMode);
  };

  const handleSurveyClick = (row: number, _col: number) => {
    // Survey reveals mine count in the clicked row
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSurvey('row', row);
    setSurveyMode(false);
  };

  const handleToggleSurveyMode = () => {
    const newMode = !surveyMode;
    clearAllModes();
    setSurveyMode(newMode);
  };

  // Check for new unlock when game ends
  const isGameOver = state.phase === GamePhase.RunOver || state.phase === GamePhase.Victory;
  const justUnlocked =
    isGameOver &&
    state.run.currentFloor >= 5 &&
    !stats.unlocks.includes(UNLOCK_FLOOR_5_REWARD);

  // Show unlock splash when unlock happens (only once per run)
  useEffect(() => {
    if (justUnlocked && !pendingUnlock && !unlockShownThisRun) {
      const unlockedPowerUp = getPowerUpById(UNLOCK_FLOOR_5_REWARD);
      if (unlockedPowerUp) {
        setPendingUnlock(unlockedPowerUp);
        setUnlockShownThisRun(true);
      }
    }
  }, [justUnlocked, pendingUnlock, unlockShownThisRun]);

  // Reset unlock tracking when starting a new run
  useEffect(() => {
    if (state.phase === GamePhase.Start || state.phase === GamePhase.Playing) {
      setPendingUnlock(null);
      setUnlockShownThisRun(false);
    }
  }, [state.phase]);

  // Record run on game over/victory
  const handleRunEnd = () => {
    const isVictory = state.phase === GamePhase.Victory;
    recordRun(state.run.currentFloor, state.run.score, state.run.ascensionLevel, isVictory);
    startRun(stats.unlocks, 0); // Default to normal difficulty
  };

  // Start a new run at a specific ascension level (for ascension unlock button)
  const handleStartAscension = (ascensionLevel: AscensionLevel) => {
    const isVictory = state.phase === GamePhase.Victory;
    recordRun(state.run.currentFloor, state.run.score, state.run.ascensionLevel, isVictory);
    startRun(stats.unlocks, ascensionLevel);
  };

  const handleUnlockContinue = () => {
    setPendingUnlock(null);
  };

  return (
    <div ref={containerRef} className="minesweeper-container roguelike-mode">
      {/* Start Screen */}
      {state.phase === GamePhase.Start && <StartScreen stats={stats} onStartRun={handleStartRun} />}

      {/* Main Game */}
      {state.phase === GamePhase.Playing && (
        <>
          <RoguelikeHeader
            floor={state.run.currentFloor}
            score={state.run.score}
            time={state.time}
            minesRemaining={state.minesRemaining}
            run={state.run}
            xRayMode={xRayMode}
            canUseXRay={canUseXRay}
            onToggleXRay={handleToggleXRayMode}
            peekMode={peekMode}
            canUsePeek={canUsePeek}
            onTogglePeek={handleTogglePeekMode}
            safePathMode={safePathMode}
            canUseSafePath={canUseSafePath}
            onToggleSafePath={handleToggleSafePathMode}
            defusalKitMode={defusalKitMode}
            canUseDefusalKit={canUseDefusalKit}
            onToggleDefusalKit={handleToggleDefusalKitMode}
            surveyMode={surveyMode}
            canUseSurvey={canUseSurvey}
            onToggleSurvey={handleToggleSurveyMode}
            surveyResult={state.surveyResult}
            mineDetectorCount={mineDetectorCount}
            zeroCellCount={state.zeroCellCount}
          />
          {xRayMode && <div className="xray-hint">Click a cell to reveal 3×3 area</div>}
          {peekMode && <div className="xray-hint peek-hint">Click a cell to peek at it</div>}
          {safePathMode && <div className="xray-hint safe-path-hint">Click a cell to reveal safe cells in that row</div>}
          {defusalKitMode && <div className="xray-hint defusal-hint">Click a flagged mine to remove it</div>}
          {surveyMode && <div className="xray-hint survey-hint">Click a row to count mines in it</div>}
          <div className="minesweeper">
            <Board
              board={state.board}
              onReveal={revealCell}
              onFlag={toggleFlag}
              onChord={chordClick}
              gameOver={false}
              dangerCells={state.dangerCells}
              patternMemoryCells={state.patternMemoryCells}
              heatMapEnabled={state.heatMapEnabled}
              xRayMode={xRayMode && canUseXRay}
              peekMode={peekMode && canUsePeek}
              safePathMode={safePathMode && canUseSafePath}
              defusalKitMode={defusalKitMode && canUseDefusalKit}
              surveyMode={surveyMode && canUseSurvey}
              peekCell={state.peekCell}
              onXRay={handleXRayClick}
              onPeek={handlePeekClick}
              onSafePath={handleSafePathClick}
              onDefusalKit={handleDefusalKitClick}
              onSurvey={handleSurveyClick}
              onCellHover={hasMineDetector ? handleCellHover : undefined}
              onCellHoverEnd={hasMineDetector ? handleCellHoverEnd : undefined}
              detectorCenter={hasMineDetector && !state.isFirstClick ? hoveredCell : null}
              chordHighlightCells={state.chordHighlightCells}
              onChordHighlightStart={setChordHighlight}
              onChordHighlightEnd={clearChordHighlight}
              fadedCells={state.fadedCells}
            />
          </div>
        </>
      )}

      {/* Power-Up Draft */}
      {state.phase === GamePhase.Draft && (
        <PowerUpDraft
          options={state.draftOptions}
          floorCleared={state.run.currentFloor}
          score={state.run.score}
          onSelect={selectPowerUp}
          onContinue={() => skipDraft(500)}
        />
      )}

      {/* Close Call Animation (Iron Will saved) */}
      {state.closeCallCell && <CloseCallOverlay />}

      {/* Explosion Animation */}
      {state.phase === GamePhase.Exploding && <ExplosionOverlay onComplete={explosionComplete} />}

      {/* Floor Clear Animation */}
      {state.phase === GamePhase.FloorClear && (
        <FloorClearOverlay
          floor={state.run.currentFloor}
          isVictory={isFinalFloor(state.run.currentFloor)}
          onComplete={floorClearComplete}
        />
      )}

      {/* Unlock Splash Screen (shows before Run Over if player unlocked something) */}
      {isGameOver && pendingUnlock && (
        <UnlockSplashScreen powerUp={pendingUnlock} onContinue={handleUnlockContinue} />
      )}

      {/* Run Over / Victory */}
      {isGameOver && !pendingUnlock && (
        <RunOverScreen
          isVictory={state.phase === GamePhase.Victory}
          floor={state.run.currentFloor}
          score={state.run.score}
          time={state.time}
          powerUps={state.run.activePowerUps}
          stats={stats}
          seed={state.run.seed}
          currentAscension={state.run.ascensionLevel}
          onTryAgain={handleRunEnd}
          onStartAscension={handleStartAscension}
        />
      )}
    </div>
  );
}

export default Minesweeper;
