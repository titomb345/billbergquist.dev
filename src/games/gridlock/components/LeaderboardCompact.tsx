import type { LeaderboardEntry } from '../types';
import '../styles.css';

interface LeaderboardCompactProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  currentPlayerName?: string;
}

/** Compact top-5 leaderboard that fits inline without scrolling */
function LeaderboardCompact({ entries, loading, currentPlayerName }: LeaderboardCompactProps) {
  if (loading) {
    return <div className="lbCompactStatus">Loading...</div>;
  }

  const top5 = entries.slice(0, 5);

  if (top5.length === 0) {
    return <div className="lbCompactStatus">No scores yet</div>;
  }

  return (
    <div className="lbCompact">
      <div className="lbCompactTitle">Top Scores</div>
      <div className="lbCompactList">
        {top5.map((entry, i) => {
          const isMe =
            currentPlayerName &&
            entry.player_name.toLowerCase() === currentPlayerName.toLowerCase();
          return (
            <div key={entry.id} className={`lbCompactRow ${isMe ? 'lbCompactMe' : ''}`}>
              <span className="lbCompactRank">{i + 1}.</span>
              <span className="lbCompactName">{entry.player_name}</span>
              <span className="lbCompactScore">{entry.score.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LeaderboardCompact;
