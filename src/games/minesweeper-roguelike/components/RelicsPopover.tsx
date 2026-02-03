import { useEffect, useCallback, useState, useRef } from 'react';
import { PowerUp } from '../types';

interface RelicsPopoverProps {
  relics: PowerUp[];
  onClose: () => void;
}

function RelicsPopover({ relics, onClose }: RelicsPopoverProps) {
  const [hoveredRelic, setHoveredRelic] = useState<PowerUp | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    // Delay adding click listener to prevent immediate close from the button click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(timer);
    };
  }, [handleKeyDown, handleClickOutside]);

  return (
    <div ref={popoverRef} className="runover-relics-popover">
      <div className="runover-relics-header">
        <span className="runover-relics-title">Relics</span>
        <button className="runover-relics-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="runover-relics-grid">
        {relics.map((relic) => (
          <span
            key={relic.id}
            className={`runover-relic-icon rarity-${relic.rarity} ${hoveredRelic?.id === relic.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredRelic(relic)}
          >
            {relic.icon}
          </span>
        ))}
      </div>
      {hoveredRelic ? (
        <div className="runover-relic-detail">
          <div className="runover-relic-detail-header">
            <span className="runover-relic-detail-name">{hoveredRelic.name}</span>
            <span className={`rarity-badge rarity-${hoveredRelic.rarity}`}>
              {hoveredRelic.rarity}
            </span>
            <span className={`type-badge ${hoveredRelic.type}`}>
              {hoveredRelic.type}
            </span>
          </div>
          <span className="runover-relic-detail-desc">{hoveredRelic.description}</span>
        </div>
      ) : (
        <div className="runover-relic-detail runover-relic-hint">
          Hover to see details
        </div>
      )}
    </div>
  );
}

export default RelicsPopover;
