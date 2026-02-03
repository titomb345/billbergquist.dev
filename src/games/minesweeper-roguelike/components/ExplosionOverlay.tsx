import { useEffect } from 'react';

// Pre-allocate particle data to avoid allocation and Math.random calls on each render
const PARTICLE_DATA = Array.from({ length: 12 }, (_, i) => ({
  index: i,
  distance: 80 + Math.random() * 60,
}));

interface ExplosionOverlayProps {
  onComplete: () => void;
}

function ExplosionOverlay({ onComplete }: ExplosionOverlayProps) {
  useEffect(() => {
    // Trigger completion after animation finishes
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="explosion-overlay">
      <div className="explosion-container">
        {/* Multiple expanding rings */}
        <div className="explosion-ring ring-1" />
        <div className="explosion-ring ring-2" />
        <div className="explosion-ring ring-3" />

        {/* Central flash */}
        <div className="explosion-flash" />

        {/* Pixel debris particles */}
        {PARTICLE_DATA.map((particle) => (
          <div
            key={particle.index}
            className="explosion-particle"
            style={{
              '--angle': `${particle.index * 30}deg`,
              '--delay': `${particle.index * 0.03}s`,
              '--distance': `${particle.distance}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Screen shake handled by parent container */}
      </div>

      {/* Scanlines for retro effect */}
      <div className="explosion-scanlines" />

      {/* Death text */}
      <div className="explosion-text">BOOM</div>
    </div>
  );
}

export default ExplosionOverlay;
