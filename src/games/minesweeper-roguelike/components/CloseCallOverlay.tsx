function CloseCallOverlay() {
  return (
    <div className="close-call-overlay">
      <div className="close-call-container">
        {/* Shield pulse effect */}
        <div className="shield-pulse shield-1" />
        <div className="shield-pulse shield-2" />

        {/* Shield icon */}
        <div className="shield-icon">🛡️</div>

        {/* Close call text */}
        <div className="close-call-text">CLOSE CALL!</div>
      </div>

      {/* Scanlines for retro effect */}
      <div className="close-call-scanlines" />
    </div>
  );
}

export default CloseCallOverlay;
