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
import IronWillSaveOverlay from './components/IronWillSaveOverlay';
import PauseOverlay from './components/PauseOverlay';
import GameToast from './components/GameToast';
import { isFinalFloor, hasPowerUp } from './logic/roguelikeLogic';
import { GamePhase } from './types';
import { AscensionLevel } from './ascension';
import { computeMineDensityForFloor } from './constants';
import './styles.css';

interface MinesweeperProps {
  resetRef?: MutableRefObject<(() => void) | null>;
  isPaused?: boolean;
  onResume?: () => void;
}

function Minesweeper({ resetRef, isPaused = false, onResume }: MinesweeperProps) {
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
    useProbabilityLens,
    useMineDetector,
    toggleSixthSenseArm,
    selectPowerUp,
    explosionComplete,
    floorClearComplete,
    ironWillComplete,
    setChordHighlight,
    clearChordHighlight,
  } = useRoguelikeState(isConstrained, isPaused);

  const [xRayMode, setXRayMode] = useState(false);
  const [peekMode, setPeekMode] = useState(false);
  const [safePathMode, setSafePathMode] = useState(false);
  const [defusalKitMode, setDefusalKitMode] = useState(false);
  const [surveyMode, setSurveyMode] = useState(false);
  const [mineDetectorMode, setMineDetectorMode] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Wrapper that records the run before going to start (if a run was active)
  const handleGoToStart = useCallback(() => {
    // If we're in a state where a run was in progress or just ended, record it
    if (
      state.phase === GamePhase.Playing ||
      state.phase === GamePhase.Draft ||
      state.phase === GamePhase.FloorClear ||
      state.phase === GamePhase.RunOver ||
      state.phase === GamePhase.Victory
    ) {
      const isVictory = state.phase === GamePhase.Victory;
      recordRun(state.run.currentFloor, state.run.score, state.run.ascensionLevel, isVictory);
    }
    goToStart();
  }, [
    state.phase,
    state.run.currentFloor,
    state.run.score,
    state.run.ascensionLevel,
    goToStart,
    recordRun,
  ]);

  // Expose reset function to parent via ref
  useEffect(() => {
    if (resetRef) {
      resetRef.current = handleGoToStart;
    }
    return () => {
      if (resetRef) {
        resetRef.current = null;
      }
    };
  }, [resetRef, handleGoToStart]);

  // Auto-clear pause when phase changes away from Playing
  useEffect(() => {
    if (state.phase !== GamePhase.Playing && isPaused) {
      onResume?.();
    }
  }, [state.phase, isPaused, onResume]);

  const handleStartRun = (ascensionLevel: AscensionLevel = 0) => {
    const params = new URLSearchParams(window.location.search);
    const startFloor = parseInt(params.get('floor') ?? '', 10);
    startRun(ascensionLevel, startFloor > 0 ? startFloor : undefined);
  };

  // Compute mine density info (single source of truth for HUD display)
  // Iron Will can only trigger once per floor, so if it was used, trauma was 1 less at generation time
  const traumaAtFloorGen = state.run.ironWillUsedThisFloor
    ? state.run.traumaStacks - 1
    : state.run.traumaStacks;
  const densityInfo = computeMineDensityForFloor({
    floor: state.run.currentFloor,
    isMobile: isConstrained,
    ascensionLevel: state.run.ascensionLevel,
    hasOraclesGift: hasPowerUp(state.run, 'oracles-gift'),
    traumaStacks: traumaAtFloorGen,
    currentTraumaStacks: state.run.traumaStacks,
  });

  // Mine Detector: active scan mode
  const hasMineDetector = state.run.activePowerUps.some((p) => p.id === 'mine-detector');
  const canUseMineDetector =
    hasMineDetector && state.run.mineDetectorScansRemaining > 0 && !state.isFirstClick;

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
  const canUseDefusalKit =
    hasDefusalKit && !state.run.defusalKitUsedThisFloor && !state.isFirstClick;

  // Check if Survey is available
  const hasSurvey = state.run.activePowerUps.some((p) => p.id === 'survey');
  const canUseSurvey =
    hasSurvey && state.run.surveyChargesRemaining > 0 && !state.isFirstClick;

  // Check if Probability Lens is available
  const hasProbabilityLens = state.run.activePowerUps.some((p) => p.id === 'probability-lens');
  const canUseProbabilityLens =
    hasProbabilityLens && !state.run.probabilityLensUsedThisFloor && !state.isFirstClick;

  // Check if Sixth Sense is available
  const hasSixthSense = state.run.activePowerUps.some((p) => p.id === 'sixth-sense');
  const canUseSixthSense =
    hasSixthSense && state.run.sixthSenseChargesRemaining > 0 && !state.isFirstClick;

  const clearAllModes = () => {
    setXRayMode(false);
    setPeekMode(false);
    setSafePathMode(false);
    setDefusalKitMode(false);
    setSurveyMode(false);
    setMineDetectorMode(false);
    if (state.run.sixthSenseArmed) {
      toggleSixthSenseArm();
    }
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

  const handleMineDetectorClick = (row: number, col: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMineDetector(row, col);
    setMineDetectorMode(false);
  };

  const handleToggleMineDetectorMode = () => {
    const newMode = !mineDetectorMode;
    clearAllModes();
    setMineDetectorMode(newMode);
  };

  const handleUseProbabilityLens = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useProbabilityLens();
  };

  const handleToggleSixthSenseArm = () => {
    // Clear other modes first, then toggle arm
    setXRayMode(false);
    setPeekMode(false);
    setSafePathMode(false);
    setDefusalKitMode(false);
    setSurveyMode(false);
    setMineDetectorMode(false);
    toggleSixthSenseArm();
  };

  const isGameOver = state.phase === GamePhase.RunOver || state.phase === GamePhase.Victory;

  // Record run on game over/victory
  const handleRunEnd = () => {
    const isVictory = state.phase === GamePhase.Victory;
    recordRun(state.run.currentFloor, state.run.score, state.run.ascensionLevel, isVictory);
    startRun(state.run.ascensionLevel); // Preserve current ascension level
  };

  // Start a new run at a specific ascension level (for ascension unlock button)
  const handleStartAscension = (ascensionLevel: AscensionLevel) => {
    const isVictory = state.phase === GamePhase.Victory;
    recordRun(state.run.currentFloor, state.run.score, state.run.ascensionLevel, isVictory);
    startRun(ascensionLevel);
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
            densityInfo={densityInfo}
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
            surveyChargesRemaining={state.run.surveyChargesRemaining}
            mineDetectorMode={mineDetectorMode}
            canUseMineDetector={canUseMineDetector}
            onToggleMineDetector={handleToggleMineDetectorMode}
            mineDetectorScansRemaining={state.run.mineDetectorScansRemaining}
            zeroCellCount={state.zeroCellCount}
            canUseProbabilityLens={canUseProbabilityLens}
            onUseProbabilityLens={handleUseProbabilityLens}
            probabilityLensActive={state.probabilityLensCells.size > 0}
            sixthSenseArmed={state.run.sixthSenseArmed}
            canUseSixthSense={canUseSixthSense}
            onToggleSixthSenseArm={handleToggleSixthSenseArm}
            sixthSenseChargesRemaining={state.run.sixthSenseChargesRemaining}
          />
          <div className="board-with-hints">
            <GameToast variant="hint" visible={xRayMode} message={state.run.activePowerUps.find((p) => p.id === 'x-ray-vision')?.activeHint ?? ''} color="var(--neon-mint)" />
            <GameToast variant="hint" visible={peekMode} message={state.run.activePowerUps.find((p) => p.id === 'peek')?.activeHint ?? ''} color="var(--neon-purple)" />
            <GameToast variant="hint" visible={safePathMode} message={state.run.activePowerUps.find((p) => p.id === 'safe-path')?.activeHint ?? ''} color="var(--neon-mint)" />
            <GameToast variant="hint" visible={defusalKitMode} message={state.run.activePowerUps.find((p) => p.id === 'defusal-kit')?.activeHint ?? ''} color="var(--neon-mint)" />
            <GameToast variant="hint" visible={surveyMode} message={state.run.activePowerUps.find((p) => p.id === 'survey')?.activeHint ?? ''} color="var(--neon-yellow)" />
            <GameToast variant="hint" visible={mineDetectorMode} message={state.run.activePowerUps.find((p) => p.id === 'mine-detector')?.activeHint ?? ''} color="#00f5ff" />
            <GameToast variant="hint" visible={state.run.sixthSenseArmed} message={state.run.activePowerUps.find((p) => p.id === 'sixth-sense')?.activeHint ?? ''} color="var(--neon-yellow)" />
            <GameToast visible={state.sixthSenseTriggered} message="Sixth Sense triggered!" color="var(--neon-yellow)" />
            <GameToast visible={state.falseStartTriggered} message="False Start — Flag removed" color="#f87171" />
            <div className="minesweeper">
              <Board
                board={state.board}
                onReveal={revealCell}
                onFlag={toggleFlag}
                onChord={chordClick}
                gameOver={false}
                dangerCells={state.dangerCells}
                patternMemoryCells={state.patternMemoryCells}
                xRayMode={xRayMode && canUseXRay}
                peekMode={peekMode && canUsePeek}
                safePathMode={safePathMode && canUseSafePath}
                defusalKitMode={defusalKitMode && canUseDefusalKit}
                surveyMode={surveyMode && canUseSurvey}
                mineDetectorMode={mineDetectorMode && canUseMineDetector}
                peekCell={state.peekCell}
                mineDetectorResult={state.mineDetectorResult}
                onXRay={handleXRayClick}
                onPeek={handlePeekClick}
                onSafePath={handleSafePathClick}
                onDefusalKit={handleDefusalKitClick}
                onSurvey={handleSurveyClick}
                surveyedRows={state.surveyedRows}
                onMineDetector={handleMineDetectorClick}
                onCellHover={mineDetectorMode ? handleCellHover : undefined}
                onCellHoverEnd={mineDetectorMode ? handleCellHoverEnd : undefined}
                mineDetectorScannedCells={state.mineDetectorScannedCells}
                detectorCenter={mineDetectorMode && !state.isFirstClick ? hoveredCell : null}
                chordHighlightCells={state.chordHighlightCells}
                onChordHighlightStart={setChordHighlight}
                onChordHighlightEnd={clearChordHighlight}
                fadedCells={state.fadedCells}
                probabilityLensCells={state.probabilityLensCells}
                oracleGiftCells={state.oracleGiftCells}
              />
            </div>
          </div>
          {isPaused && onResume && (
            <PauseOverlay onResume={onResume} onRestartRun={handleGoToStart} />
          )}
        </>
      )}

      {/* Power-Up Draft */}
      {state.phase === GamePhase.Draft && (
        <PowerUpDraft
          options={state.draftOptions}
          floorCleared={state.run.currentFloor}
          score={state.run.score}
          onSelect={selectPowerUp}
        />
      )}

      {/* Iron Will Save Animation */}
      {state.phase === GamePhase.IronWillSave && (
        <IronWillSaveOverlay onComplete={ironWillComplete} traumaStacks={state.run.traumaStacks} />
      )}

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

      {/* Run Over / Victory */}
      {isGameOver && (
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
