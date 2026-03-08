import { useRef, useState, useCallback, useEffect, useMemo, type MutableRefObject } from 'react';
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
import type { AscensionLevel } from './ascension';
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
    activateXRay,
    activatePeek,
    activateSafePath,
    activateDefusalKit,
    activateSurvey,
    activateProbabilityLens,
    activateMineDetector,
    toggleSixthSenseArm,
    selectPowerUp,
    explosionComplete,
    floorClearComplete,
    ironWillComplete,
    setChordHighlight,
    clearChordHighlight,
  } = useRoguelikeState(isConstrained, isPaused);

  type AbilityMode = 'xRay' | 'peek' | 'safePath' | 'defusalKit' | 'survey' | 'mineDetector';
  const [activeMode, setActiveMode] = useState<AbilityMode | null>(null);
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

  // Build a Set of active power-up IDs for O(1) lookups
  const activePowerUpIds = useMemo(
    () => new Set(state.run.activePowerUps.map((p) => p.id)),
    [state.run.activePowerUps],
  );

  // Memoize hint text map so we don't scan activePowerUps 7 times per render
  const hintMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of state.run.activePowerUps) {
      if (p.activeHint) map.set(p.id, p.activeHint);
    }
    return map;
  }, [state.run.activePowerUps]);

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredCell({ row, col });
  }, []);

  const handleCellHoverEnd = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Ability availability
  const canUseXRay = activePowerUpIds.has('x-ray-vision') && !state.run.xRayUsedThisFloor && !state.isFirstClick;
  const canUsePeek = activePowerUpIds.has('peek') && !state.run.peekUsedThisFloor && !state.isFirstClick;
  const canUseSafePath = activePowerUpIds.has('safe-path') && !state.run.safePathUsedThisFloor && !state.isFirstClick;
  const canUseDefusalKit = activePowerUpIds.has('defusal-kit') && !state.run.defusalKitUsedThisFloor && !state.isFirstClick;
  const canUseSurvey = activePowerUpIds.has('survey') && state.run.surveyChargesRemaining > 0 && !state.isFirstClick;
  const canUseMineDetector = activePowerUpIds.has('mine-detector') && state.run.mineDetectorScansRemaining > 0 && !state.isFirstClick;
  const canUseProbabilityLens = activePowerUpIds.has('probability-lens') && !state.run.probabilityLensUsedThisFloor && !state.isFirstClick;
  const canUseSixthSense = activePowerUpIds.has('sixth-sense') && state.run.sixthSenseChargesRemaining > 0 && !state.isFirstClick;

  const clearAllModes = () => {
    setActiveMode(null);
    if (state.run.sixthSenseArmed) toggleSixthSenseArm();
  };

  /** Toggle an ability mode (mutually exclusive with all others) */
  const toggleMode = (mode: AbilityMode) => {
    const wasActive = activeMode === mode;
    clearAllModes();
    if (!wasActive) setActiveMode(mode);
  };

  /** Use an ability and deactivate its mode */
  const handleXRayClick = (row: number, col: number) => { activateXRay(row, col); setActiveMode(null); };
  const handlePeekClick = (row: number, col: number) => { activatePeek(row, col); setActiveMode(null); };
  const handleSafePathClick = (row: number, _col: number) => { activateSafePath('row', row); setActiveMode(null); };
  const handleDefusalKitClick = (row: number, col: number) => { activateDefusalKit(row, col); setActiveMode(null); };
  const handleSurveyClick = (row: number, _col: number) => { activateSurvey('row', row); setActiveMode(null); };
  const handleMineDetectorClick = (row: number, col: number) => { activateMineDetector(row, col); setActiveMode(null); };

  const handleToggleSixthSenseArm = () => {
    setActiveMode(null);
    toggleSixthSenseArm();
  };

  // Derive boolean flags from single activeMode state
  const xRayMode = activeMode === 'xRay';
  const peekMode = activeMode === 'peek';
  const safePathMode = activeMode === 'safePath';
  const defusalKitMode = activeMode === 'defusalKit';
  const surveyMode = activeMode === 'survey';
  const mineDetectorMode = activeMode === 'mineDetector';

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
            onToggleXRay={() => toggleMode('xRay')}
            peekMode={peekMode}
            canUsePeek={canUsePeek}
            onTogglePeek={() => toggleMode('peek')}
            safePathMode={safePathMode}
            canUseSafePath={canUseSafePath}
            onToggleSafePath={() => toggleMode('safePath')}
            defusalKitMode={defusalKitMode}
            canUseDefusalKit={canUseDefusalKit}
            onToggleDefusalKit={() => toggleMode('defusalKit')}
            surveyMode={surveyMode}
            canUseSurvey={canUseSurvey}
            onToggleSurvey={() => toggleMode('survey')}
            surveyChargesRemaining={state.run.surveyChargesRemaining}
            mineDetectorMode={mineDetectorMode}
            canUseMineDetector={canUseMineDetector}
            onToggleMineDetector={() => toggleMode('mineDetector')}
            mineDetectorScansRemaining={state.run.mineDetectorScansRemaining}
            canUseProbabilityLens={canUseProbabilityLens}
            onUseProbabilityLens={activateProbabilityLens}
            probabilityLensActive={state.probabilityLensCells.size > 0}
            sixthSenseArmed={state.run.sixthSenseArmed}
            canUseSixthSense={canUseSixthSense}
            onToggleSixthSenseArm={handleToggleSixthSenseArm}
            sixthSenseChargesRemaining={state.run.sixthSenseChargesRemaining}
          />
          <div className="board-with-hints">
            <GameToast variant="hint" visible={xRayMode} message={hintMap.get('x-ray-vision') ?? ''} color="var(--neon-mint)" />
            <GameToast variant="hint" visible={peekMode} message={hintMap.get('peek') ?? ''} color="var(--neon-purple)" />
            <GameToast variant="hint" visible={safePathMode} message={hintMap.get('safe-path') ?? ''} color="var(--neon-mint)" />
            <GameToast variant="hint" visible={defusalKitMode} message={hintMap.get('defusal-kit') ?? ''} color="var(--neon-mint)" />
            <GameToast variant="hint" visible={surveyMode} message={hintMap.get('survey') ?? ''} color="var(--neon-yellow)" />
            <GameToast variant="hint" visible={mineDetectorMode} message={hintMap.get('mine-detector') ?? ''} color="#00f5ff" />
            <GameToast variant="hint" visible={state.run.sixthSenseArmed} message={hintMap.get('sixth-sense') ?? ''} color="var(--neon-yellow)" />
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
                openingsMapCells={state.openingsMapCells}
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
