interface HomeIconProps {
  className?: string;
}

function HomeIcon({ className }: HomeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <filter id="homeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Roof */}
      <path
        d="M12 3L3 11H6V20H18V11H21L12 3Z"
        stroke="#ff00ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#homeGlow)"
      />

      {/* Door */}
      <path
        d="M10 20V14H14V20"
        stroke="#ff00ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#homeGlow)"
      />
    </svg>
  );
}

export default HomeIcon;
