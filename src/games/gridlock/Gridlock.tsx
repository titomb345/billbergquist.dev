import { useCallback, useEffect, useState } from 'react';
import { GamePhase } from './types';
import { useGridlockState } from './hooks/useGridlockState';
import { useGameLoop } from './hooks/useGameLoop';
import { useInputHandler } from './hooks/useInputHandler';
import { useLeaderboard } from './hooks/useLeaderboard';
import { loadStats, saveStats } from './persistence/storage';
import Board from './components/Board';
import HUD from './components/HUD';
import PiecePreview from './components/PiecePreview';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import PauseOverlay from './components/PauseOverlay';
import MobileControls from './components/MobileControls';
import './styles.css';

interface GridlockProps {
  resetRef: React.RefObject<(() => void) | null>;
  isPaused: boolean;
  onResume: () => void;
}

function Gridlock({ resetRef, isPaused, onResume }: GridlockProps) {
  const { state, dispatch, startGame, reset } = useGridlockState();
  const { entries, loading, submitting, submitted, error: lbError, submitScore, resetSubmission } =
    useLeaderboard();
  const [stats, setStats] = useState(() => loadStats());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  // Handle pause from ArcadeCabinet
  useEffect(() => {
    if (isPaused && state.phase === GamePhase.Playing) {
      dispatch({ type: 'PAUSE' });
    }
  }, [isPaused, state.phase, dispatch]);

  // Hook up reset ref for ArcadeCabinet
  useEffect(() => {
    resetRef.current = () => {
      reset();
      resetSubmission();
    };
  }, [reset, resetRef, resetSubmission]);

  // Game loop
  useGameLoop(state.phase, dispatch);

  // Input handler
  const handlePause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, [dispatch]);

  useInputHandler(state.phase, dispatch, handlePause);

  // Save stats on game over
  useEffect(() => {
    if (state.phase === GamePhase.GameOver) {
      const newStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        bestScore: Math.max(stats.bestScore, state.score),
        bestLevel: Math.max(stats.bestLevel, state.level),
        totalLines: stats.totalLines + state.lines,
      };
      setStats(newStats);
      saveStats(newStats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleStart = useCallback(() => {
    resetSubmission();
    startGame(isMobile);
  }, [isMobile, startGame, resetSubmission]);

  const handleResume = useCallback(() => {
    dispatch({ type: 'RESUME' });
    onResume();
  }, [dispatch, onResume]);

  const handleSubmitScore = useCallback(
    (name: string) => {
      const newStats = { ...stats, playerName: name };
      setStats(newStats);
      saveStats(newStats);
      submitScore(name, state.score, state.level, state.lines);
    },
    [stats, state.score, state.level, state.lines, submitScore],
  );

  return (
    <div className="gridlock">
      <HUD score={state.score} level={state.level} lines={state.lines} />

      <div className="gameArea">
        <div className="sidePanel">
          <PiecePreview type={state.heldPiece} label="Hold" />
        </div>

        <div className="boardWrapper">
          <Board
            board={state.board}
            activePiece={state.activePiece}
            ghostY={state.ghostY}
            clearingLines={state.clearingLines}
          />
        </div>

        <div className="sidePanel">
          <PiecePreview type={state.nextPiece} label="Next" />
        </div>
      </div>

      {isMobile && state.phase === GamePhase.Playing && (
        <MobileControls
          dispatch={dispatch}
          onHold={() => dispatch({ type: 'HOLD' })}
        />
      )}

      {/* Overlays cover the entire .gridlock container */}
      {state.phase === GamePhase.Start && (
        <StartScreen
          onStart={handleStart}
          isMobile={isMobile}
          leaderboardEntries={entries}
          leaderboardLoading={loading}
          playerName={stats.playerName}
        />
      )}

      {state.phase === GamePhase.Paused && (
        <PauseOverlay onResume={handleResume} />
      )}

      {state.phase === GamePhase.GameOver && (
        <GameOverScreen
          score={state.score}
          level={state.level}
          lines={state.lines}
          savedName={stats.playerName}
          onSubmitScore={handleSubmitScore}
          onPlayAgain={handleStart}
          isSubmitting={submitting}
          submitted={submitted}
          error={lbError}
          leaderboardEntries={entries}
          leaderboardLoading={loading}
        />
      )}
    </div>
  );
}

export default Gridlock;
