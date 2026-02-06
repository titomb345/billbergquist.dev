import { PowerUp } from '../types';
import { RARITY_COLORS } from '../constants';

interface PowerUpDraftProps {
  options: PowerUp[];
  floorCleared: number;
  score: number;
  onSelect: (powerUp: PowerUp) => void;
}

function PowerUpDraft({ options, floorCleared, score, onSelect }: PowerUpDraftProps) {
  return (
    <div className="draft-screen">
      <div className="draft-header">
        <h2 className="draft-title">FLOOR {floorCleared} CLEARED!</h2>
        <p className="draft-score">Score: {score.toLocaleString()}</p>
      </div>

      <p className="draft-instruction">Choose your reward:</p>
      <div className="draft-cards">
        {options.map((powerUp) => (
          <button
            key={powerUp.id}
            className={`draft-card rarity-${powerUp.rarity}`}
            onClick={() => onSelect(powerUp)}
            style={{ '--rarity-color': RARITY_COLORS[powerUp.rarity] } as React.CSSProperties}
          >
            <div className="draft-card-left">
              <span className="draft-card-icon">{powerUp.icon}</span>
            </div>
            <div className="draft-card-right">
              <div className="draft-card-header">
                <span className="draft-card-name">{powerUp.name}</span>
                <span className={`rarity-badge rarity-${powerUp.rarity}`}>
                  {powerUp.rarity}
                </span>
                <span className={`type-badge ${powerUp.type}`}>{powerUp.type}</span>
              </div>
              <span className="draft-card-description">{powerUp.description}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="draft-hint">Floor {floorCleared + 1} awaits...</p>
    </div>
  );
}

export default PowerUpDraft;
