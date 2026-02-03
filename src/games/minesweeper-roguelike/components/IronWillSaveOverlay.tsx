import { useEffect, useState } from 'react';

// Pre-allocate particle data for explosion effect
const PARTICLE_DATA = Array.from({ length: 8 }, (_, i) => ({
  index: i,
  distance: 60 + Math.random() * 40,
}));

interface IronWillSaveOverlayProps {
  onComplete: () => void;
}

function IronWillSaveOverlay({ onComplete }: IronWillSaveOverlayProps) {
  const [phase, setPhase] = useState<'explosion' | 'shield'>('explosion');

  useEffect(() => {
    // Phase 1: Explosion starts (0-700ms)
    // Phase 2: Shield intercepts (700ms+)
    const shieldTimer = setTimeout(() => {
      setPhase('shield');
    }, 700);

    // Complete animation after 2800ms (gives shield phase ~2100ms)
    const completeTimer = setTimeout(onComplete, 2800);

    return () => {
      clearTimeout(shieldTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="iron-will-overlay">
      <div className="iron-will-container">
        {/* Phase 1: Explosion starting (interrupted) */}
        <div className={`iron-will-explosion ${phase === 'shield' ? 'interrupted' : ''}`}>
          {/* Expanding rings */}
          <div className="iron-will-ring ring-1" />
          <div className="iron-will-ring ring-2" />

          {/* Central flash */}
          <div className="iron-will-flash" />

          {/* Pixel debris particles */}
          {PARTICLE_DATA.map((particle) => (
            <div
              key={particle.index}
              className="iron-will-particle"
              style={{
                '--angle': `${particle.index * 45}deg`,
                '--delay': `${particle.index * 0.02}s`,
                '--distance': `${particle.distance}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Phase 2: Shield intercept */}
        {phase === 'shield' && (
          <div className="iron-will-shield-container">
            {/* Shield pulse rings that block the explosion */}
            <div className="iron-will-shield-pulse shield-1" />
            <div className="iron-will-shield-pulse shield-2" />
            <div className="iron-will-shield-pulse shield-3" />

            {/* Shield icon */}
            <div className="iron-will-shield-icon">🛡️</div>

            {/* Iron Will text */}
            <div className="iron-will-text">IRON WILL!</div>
          </div>
        )}
      </div>

      {/* Scanlines for retro effect */}
      <div className="iron-will-scanlines" />
    </div>
  );
}

export default IronWillSaveOverlay;
