import { useState } from 'react';
import { PowerUp, RoguelikeStats } from '../types';
import { MAX_FLOOR } from '../constants';
import RelicsPopover from './RelicsPopover';
import { AscensionLevel, ASCENSION_INFO, MAX_ASCENSION } from '../ascension';

interface RunOverScreenProps {
  isVictory: boolean;
  floor: number;
  score: number;
  time: number;
  powerUps: PowerUp[];
  stats: RoguelikeStats;
  seed: string;
  currentAscension: AscensionLevel;
  onTryAgain: () => void;
  onStartAscension: (level: AscensionLevel) => void;
}

function RunOverScreen({
  isVictory,
  floor,
  score,
  time,
  powerUps,
  stats,
  seed,
  currentAscension,
  onTryAgain,
  onStartAscension,
}: RunOverScreenProps) {
  const [showRelicsPopover, setShowRelicsPopover] = useState(false);
  const isNewBestFloor = floor > stats.bestFloor;
  const isNewBestScore = score > stats.bestScore;

  // Check if a new ascension level was just unlocked
  const nextAscension = (currentAscension + 1) as AscensionLevel;
  const justUnlockedAscension =
    isVictory && currentAscension < MAX_ASCENSION && currentAscension >= stats.highestAscensionUnlocked;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className={`run-over-screen ${isVictory ? 'victory' : 'defeat'}`}>
      {isVictory ? (
        <>
          <h2 className="run-over-title victory-title">ESCAPED!</h2>
          <p className="run-over-subtitle">You conquered all {MAX_FLOOR} floors!</p>
        </>
      ) : (
        <>
          <h2 className="run-over-title defeat-title">RUN OVER</h2>
          <p className="run-over-subtitle">Defeated on floor {floor}</p>
        </>
      )}

      <div className="run-summary">
        <div className="summary-row">
          <span className="summary-label">Floor Reached</span>
          <span className="summary-value">
            {floor}/{MAX_FLOOR}
            {isNewBestFloor && <span className="new-best">NEW BEST!</span>}
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Final Score</span>
          <span className="summary-value">
            {score.toLocaleString()}
            {isNewBestScore && <span className="new-best">NEW BEST!</span>}
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Time</span>
          <span className="summary-value">{formatTime(time)}</span>
        </div>
        {powerUps.length > 0 && (
          <div className="summary-row">
            <span className="summary-label">Relics</span>
            <span className="summary-value">
              <button
                className="see-relics-button"
                onClick={() => setShowRelicsPopover(true)}
              >
                See Relics ({powerUps.length})
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="run-seed">
        <span className="run-seed-label">Run Seed</span>
        <span className="run-seed-value">#{seed}</span>
      </div>

      {/* Ascension Unlock Banner */}
      {justUnlockedAscension && (
        <div className="ascension-unlock-banner">
          <span className="ascension-unlock-label">ASCENSION UNLOCKED!</span>
          <span className="ascension-unlock-name">{ASCENSION_INFO[nextAscension].name}</span>
          <span className="ascension-unlock-desc">{ASCENSION_INFO[nextAscension].description}</span>
        </div>
      )}

      {/* Show ascension badge if not at normal difficulty */}
      {currentAscension > 0 && (
        <div className="run-ascension-badge">
          Completed at {ASCENSION_INFO[currentAscension].name}
        </div>
      )}

      <div className="run-over-buttons">
        {justUnlockedAscension && (
          <button className="start-ascension-button" onClick={() => onStartAscension(nextAscension)}>
            BEGIN {ASCENSION_INFO[nextAscension].name.toUpperCase()}
          </button>
        )}
        <button className="try-again-button" onClick={onTryAgain}>
          {isVictory ? 'PLAY AGAIN' : 'TRY AGAIN'}
        </button>
      </div>

      <div className="lifetime-stats">
        <span className="lifetime-label">Lifetime Stats</span>
        <span className="lifetime-value">
          {stats.totalRuns + 1} runs • {stats.floorsCleared + floor - 1} floors
        </span>
      </div>

      {showRelicsPopover && (
        <RelicsPopover relics={powerUps} onClose={() => setShowRelicsPopover(false)} />
      )}
    </div>
  );
}

export default RunOverScreen;
