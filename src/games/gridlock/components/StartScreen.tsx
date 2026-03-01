import type { LeaderboardEntry } from '../types';
import LeaderboardCompact from './LeaderboardCompact';
import '../styles.css';

interface StartScreenProps {
  onStart: () => void;
  isMobile: boolean;
  leaderboardEntries: LeaderboardEntry[];
  leaderboardLoading: boolean;
  playerName?: string;
}

function StartScreen({
  onStart,
  isMobile,
  leaderboardEntries,
  leaderboardLoading,
  playerName,
}: StartScreenProps) {
  return (
    <div className="screenOverlay">
      <div className="screenTitle">GRIDLOCK</div>
      <div className="screenSubtitle">SHOWDOWN</div>

      {!isMobile && (
        <div className="controlsGrid">
          <span className="controlKey">&larr; &rarr;</span>
          <span className="controlAction">Move</span>
          <span className="controlKey">&darr;</span>
          <span className="controlAction">Soft Drop</span>
          <span className="controlKey">&uarr;</span>
          <span className="controlAction">Rotate CW</span>
          <span className="controlKey">Z</span>
          <span className="controlAction">Rotate CCW</span>
          <span className="controlKey">Space</span>
          <span className="controlAction">Hard Drop</span>
          <span className="controlKey">C</span>
          <span className="controlAction">Hold</span>
          <span className="controlKey">Esc</span>
          <span className="controlAction">Pause</span>
        </div>
      )}

      <button className="screenButton" onClick={onStart}>
        START
      </button>

      <LeaderboardCompact
        entries={leaderboardEntries}
        loading={leaderboardLoading}
        currentPlayerName={playerName}
      />
    </div>
  );
}

export default StartScreen;
