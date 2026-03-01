import { useState, useRef, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';
import LeaderboardCompact from './LeaderboardCompact';
import '../styles.css';

interface GameOverScreenProps {
  score: number;
  level: number;
  lines: number;
  savedName: string;
  onSubmitScore: (name: string) => void;
  onPlayAgain: () => void;
  isSubmitting: boolean;
  submitted: boolean;
  error: string | null;
  leaderboardEntries: LeaderboardEntry[];
  leaderboardLoading: boolean;
}

function GameOverScreen({
  score,
  level,
  lines,
  savedName,
  onSubmitScore,
  onPlayAgain,
  isSubmitting,
  submitted,
  error,
  leaderboardEntries,
  leaderboardLoading,
}: GameOverScreenProps) {
  const [name, setName] = useState(savedName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !submitted) {
      inputRef.current.focus();
    }
  }, [submitted]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onSubmitScore(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
    e.stopPropagation();
  };

  return (
    <div className="screenOverlay">
      <div className="screenTitle">GAME OVER</div>

      <div className="statsGrid">
        <span className="statLabel">Score</span>
        <span className="statValue">{score.toLocaleString()}</span>
        <span className="statLabel">Level</span>
        <span className="statValue">{level}</span>
        <span className="statLabel">Lines</span>
        <span className="statValue">{lines}</span>
      </div>

      {!submitted ? (
        <>
          <input
            ref={inputRef}
            className="nameInput"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
            maxLength={20}
            disabled={isSubmitting}
          />
          <div className="nameHint">Submit your score to the leaderboard</div>
          {error && <div className="errorMsg">{error}</div>}
          <button
            className="screenButton"
            onClick={handleSubmit}
            disabled={isSubmitting || name.trim().length === 0}
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT SCORE'}
          </button>
        </>
      ) : (
        <div className="nameHint" style={{ color: 'rgba(191, 0, 255, 0.7)' }}>
          Score submitted!
        </div>
      )}

      <button className="screenButton" onClick={onPlayAgain}>
        PLAY AGAIN
      </button>

      <LeaderboardCompact
        entries={leaderboardEntries}
        loading={leaderboardLoading}
        currentPlayerName={savedName}
      />
    </div>
  );
}

export default GameOverScreen;
