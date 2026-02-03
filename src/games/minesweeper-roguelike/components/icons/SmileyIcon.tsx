import { GameStatus } from '../../types';

interface SmileyIconProps {
  status: GameStatus;
  size?: number;
  className?: string;
}

function SmileyIcon({ status, size = 24, className }: SmileyIconProps) {
  const getColor = () => {
    switch (status) {
      case 'won':
        return '#00ff88';
      case 'lost':
        return '#ff4444';
      default:
        return '#00f5ff';
    }
  };

  const color = getColor();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <filter id={`smileyGlow-${status}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Face outline */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
        filter={`url(#smileyGlow-${status})`}
      />

      {/* Eyes */}
      {status === 'won' ? (
        /* Sunglasses for won */
        <>
          <rect
            x="5"
            y="8"
            width="5"
            height="4"
            rx="1"
            fill={color}
            filter={`url(#smileyGlow-${status})`}
          />
          <rect
            x="14"
            y="8"
            width="5"
            height="4"
            rx="1"
            fill={color}
            filter={`url(#smileyGlow-${status})`}
          />
          <line x1="10" y1="10" x2="14" y2="10" stroke={color} strokeWidth="1" />
        </>
      ) : status === 'lost' ? (
        /* X eyes for lost */
        <>
          <g stroke={color} strokeWidth="2" filter={`url(#smileyGlow-${status})`}>
            <line x1="6" y1="7" x2="10" y2="11" />
            <line x1="10" y1="7" x2="6" y2="11" />
            <line x1="14" y1="7" x2="18" y2="11" />
            <line x1="18" y1="7" x2="14" y2="11" />
          </g>
        </>
      ) : (
        /* Normal eyes for playing */
        <>
          <circle cx="8" cy="9" r="2" fill={color} filter={`url(#smileyGlow-${status})`} />
          <circle cx="16" cy="9" r="2" fill={color} filter={`url(#smileyGlow-${status})`} />
        </>
      )}

      {/* Mouth */}
      {status === 'won' ? (
        /* Big smile for won */
        <path
          d="M7 15 Q12 20 17 15"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter={`url(#smileyGlow-${status})`}
        />
      ) : status === 'lost' ? (
        /* Frown for lost */
        <path
          d="M7 18 Q12 14 17 18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter={`url(#smileyGlow-${status})`}
        />
      ) : (
        /* Normal smile for playing */
        <path
          d="M8 15 Q12 18 16 15"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter={`url(#smileyGlow-${status})`}
        />
      )}
    </svg>
  );
}

export default SmileyIcon;
