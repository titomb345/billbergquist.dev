interface PauseOverlayProps {
  onResume: () => void;
  onRestartRun: () => void;
}

function PauseOverlay({ onResume, onRestartRun }: PauseOverlayProps) {
  return (
    <div className="pause-overlay">
      <div className="pause-scanlines" />
      <div className="pause-panel">
        <h2 className="pause-title">PAUSED</h2>
        <button className="pause-btn-resume" onClick={onResume} type="button">
          RESUME
        </button>
        <button className="pause-btn-restart" onClick={onRestartRun} type="button">
          RESTART RUN
        </button>
      </div>
    </div>
  );
}

export default PauseOverlay;
