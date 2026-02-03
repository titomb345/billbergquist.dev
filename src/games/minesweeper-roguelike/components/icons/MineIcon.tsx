interface MineIconProps {
  className?: string;
}

function MineIcon({ className }: MineIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <filter id="mineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="mineGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ff66ff" />
          <stop offset="100%" stopColor="#ff00ff" />
        </radialGradient>
      </defs>

      {/* Spikes */}
      <g filter="url(#mineGlow)" stroke="#ff00ff" strokeWidth="2">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="5" y1="5" x2="7.5" y2="7.5" />
        <line x1="16.5" y1="16.5" x2="19" y2="19" />
        <line x1="19" y1="5" x2="16.5" y2="7.5" />
        <line x1="7.5" y1="16.5" x2="5" y2="19" />
      </g>

      {/* Main body */}
      <circle cx="12" cy="12" r="6" fill="url(#mineGradient)" filter="url(#mineGlow)" />

      {/* Highlight */}
      <circle cx="10" cy="10" r="2" fill="rgba(255, 255, 255, 0.6)" />
    </svg>
  );
}

export default MineIcon;
