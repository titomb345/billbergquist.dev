import '../styles.css';

interface HUDProps {
  score: number;
  level: number;
  lines: number;
}

function HUD({ score, level, lines }: HUDProps) {
  return (
    <div className="hud">
      <div className="hudItem">
        <div className="hudLabel">Score</div>
        <div className="hudValue">{score.toLocaleString()}</div>
      </div>
      <div className="hudItem">
        <div className="hudLabel">Level</div>
        <div className="hudValue">{level}</div>
      </div>
      <div className="hudItem">
        <div className="hudLabel">Lines</div>
        <div className="hudValue">{lines}</div>
      </div>
    </div>
  );
}

export default HUD;
