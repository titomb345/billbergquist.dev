import type { LeaderboardEntry } from '../types';
import '../styles.css';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  currentPlayerName?: string;
}

function Leaderboard({ entries, loading, currentPlayerName }: LeaderboardProps) {
  if (loading) {
    return (
      <div className="leaderboard">
        <div className="leaderboardTitle">Leaderboard</div>
        <div className="leaderboardLoading">Loading scores...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="leaderboard">
        <div className="leaderboardTitle">Leaderboard</div>
        <div className="leaderboardEmpty">No scores yet. Be the first!</div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboardTitle">Leaderboard</div>
      <table className="leaderboardTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Score</th>
            <th>Lvl</th>
            <th>Lines</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const isCurrentPlayer =
              currentPlayerName &&
              entry.player_name.toLowerCase() === currentPlayerName.toLowerCase();
            return (
              <tr key={entry.id} className={isCurrentPlayer ? 'leaderboardHighlight' : ''}>
                <td className="leaderboardRank">{i + 1}</td>
                <td>{entry.player_name}</td>
                <td>{entry.score.toLocaleString()}</td>
                <td>{entry.level}</td>
                <td>{entry.lines}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
