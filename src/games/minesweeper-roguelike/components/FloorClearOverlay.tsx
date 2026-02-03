import { useEffect } from 'react';

// Pre-allocate particle data to avoid allocation and Math.random calls on each render
const SPARKLE_DATA = Array.from({ length: 16 }, (_, i) => ({
  index: i,
  distance: 100 + Math.random() * 80,
}));

interface FloorClearOverlayProps {
  floor: number;
  isVictory: boolean;
  onComplete: () => void;
}

function FloorClearOverlay({ floor, isVictory, onComplete }: FloorClearOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="floor-clear-overlay">
      <div className="floor-clear-container">
        {/* Sparkle particles */}
        {SPARKLE_DATA.map((particle) => (
          <div
            key={particle.index}
            className="sparkle-particle"
            style={{
              '--angle': `${particle.index * 22.5}deg`,
              '--delay': `${particle.index * 0.05}s`,
              '--distance': `${particle.distance}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Expanding rings */}
        <div className="clear-ring ring-1" />
        <div className="clear-ring ring-2" />

        {/* Central glow */}
        <div className="clear-glow" />
      </div>

      {/* Victory or Clear text */}
      <div className={`floor-clear-text ${isVictory ? 'victory' : ''}`}>
        {isVictory ? 'VICTORY!' : 'CLEAR!'}
      </div>

      {!isVictory && (
        <div className="floor-clear-subtext">Floor {floor} Complete</div>
      )}

      {/* Scanlines */}
      <div className="clear-scanlines" />
    </div>
  );
}

export default FloorClearOverlay;
