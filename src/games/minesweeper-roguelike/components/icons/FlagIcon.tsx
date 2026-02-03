interface FlagIconProps {
  className?: string;
}

function FlagIcon({ className }: FlagIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <filter id="flagGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff66ff" />
          <stop offset="100%" stopColor="#ff00ff" />
        </linearGradient>
      </defs>

      {/* Flag pole */}
      <line
        x1="8"
        y1="4"
        x2="8"
        y2="20"
        stroke="#ff00ff"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#flagGlow)"
      />

      {/* Flag */}
      <path d="M8 4L18 8L8 12Z" fill="url(#flagGradient)" filter="url(#flagGlow)" />

      {/* Base */}
      <path
        d="M5 20L8 18L11 20"
        stroke="#ff00ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#flagGlow)"
      />
    </svg>
  );
}

export default FlagIcon;
