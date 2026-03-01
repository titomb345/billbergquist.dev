import '../styles.css';

interface PauseOverlayProps {
  onResume: () => void;
}

function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <div className="screenOverlay">
      <div className="screenTitle">PAUSED</div>
      <button className="screenButton" onClick={onResume}>
        RESUME
      </button>
    </div>
  );
}

export default PauseOverlay;
