import { useState } from 'react';
import { RoguelikeStats } from '../types';
import { MAX_FLOOR } from '../constants';
import { AscensionLevel, ASCENSION_INFO, MAX_ASCENSION } from '../ascension';

interface StartScreenProps {
  stats: RoguelikeStats;
  onStartRun: (ascensionLevel: AscensionLevel) => void;
}

function StartScreen({ stats, onStartRun }: StartScreenProps) {
  const hasPlayed = stats.totalRuns > 0;
  const [selectedAscension, setSelectedAscension] = useState<AscensionLevel>(0);

  // Build list of available ascension levels (0 through highestUnlocked)
  const availableAscensions: AscensionLevel[] = [];
  for (let i = 0; i <= stats.highestAscensionUnlocked && i <= MAX_ASCENSION; i++) {
    availableAscensions.push(i as AscensionLevel);
  }

  const handleStartRun = () => {
    onStartRun(selectedAscension);
  };

  return (
    <div className="start-screen">
      <p className="start-subtitle">A Minesweeper Roguelike</p>

      <div className="start-description">
        <p>Clear {MAX_FLOOR} floors to escape.</p>
        <p>Each floor grows larger with more mines.</p>
        <p>One wrong step ends your run.</p>
        <p>Collect power-ups to survive.</p>
      </div>

      {/* Ascension Selector - only show if any ascensions are unlocked */}
      {stats.highestAscensionUnlocked > 0 && (
        <div className="ascension-selector">
          <div className="ascension-buttons">
            {availableAscensions.map((level) => (
              <button
                key={level}
                className={`ascension-button ${selectedAscension === level ? 'selected' : ''} ${level > 0 ? 'ascension-active' : ''}`}
                onClick={() => setSelectedAscension(level)}
              >
                {level === 0 ? 'Normal' : `A${level}`}
              </button>
            ))}
          </div>
          <p className="ascension-description">{ASCENSION_INFO[selectedAscension].description}</p>
          {selectedAscension > 0 && (
            <p className="ascension-cumulative">
              Includes: {Array.from({ length: selectedAscension }, (_, i) => `A${i + 1}`).join(' + ')}
            </p>
          )}
        </div>
      )}

      <button className="start-button" onClick={handleStartRun}>
        {hasPlayed ? 'START NEW RUN' : 'BEGIN DESCENT'}
      </button>

      {hasPlayed && (
        <div className="start-stats">
          <h3 className="stats-title">YOUR PROGRESS</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalRuns}</span>
              <span className="stat-label">Runs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {stats.bestFloor}/{MAX_FLOOR}
              </span>
              <span className="stat-label">Best Floor</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.bestScore.toLocaleString()}</span>
              <span className="stat-label">Best Score</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.floorsCleared}</span>
              <span className="stat-label">Floors Cleared</span>
            </div>
          </div>
          {stats.highestAscensionCleared > 0 && (
            <div className="stat-item ascension-stat">
              <span className="stat-value">A{stats.highestAscensionCleared}</span>
              <span className="stat-label">Best Ascension</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StartScreen;
