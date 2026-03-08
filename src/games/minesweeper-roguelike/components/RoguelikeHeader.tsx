import { useState, useRef } from 'react';
import type { RunState, PowerUp } from '../types';
import { MAX_FLOOR, type MineDensityInfo } from '../constants';

const formatNumber = (num: number): string => {
  const clamped = Math.max(-99, Math.min(999, num));
  if (clamped < 0) {
    return '-' + String(Math.abs(clamped)).padStart(2, '0');
  }
  return String(clamped).padStart(3, '0');
};

const formatScore = (num: number): string => {
  if (num >= 10000) {
    return Math.floor(num / 1000) + 'K';
  }
  return String(num);
};

/** Power-up IDs that display a charge badge */
const CHARGE_BADGE_IDS: Record<string, true> = {
  'survey': true,
  'mine-detector': true,
  'sixth-sense': true,
};

interface RoguelikeHeaderProps {
  floor: number;
  score: number;
  time: number;
  minesRemaining: number;
  run: RunState;
  xRayMode?: boolean;
  canUseXRay?: boolean;
  onToggleXRay?: () => void;
  peekMode?: boolean;
  canUsePeek?: boolean;
  onTogglePeek?: () => void;
  safePathMode?: boolean;
  canUseSafePath?: boolean;
  onToggleSafePath?: () => void;
  defusalKitMode?: boolean;
  canUseDefusalKit?: boolean;
  onToggleDefusalKit?: () => void;
  surveyMode?: boolean;
  canUseSurvey?: boolean;
  onToggleSurvey?: () => void;
  surveyChargesRemaining?: number;
  mineDetectorMode?: boolean;
  canUseMineDetector?: boolean;
  onToggleMineDetector?: () => void;
  mineDetectorScansRemaining?: number;
  densityInfo?: MineDensityInfo;
  canUseProbabilityLens?: boolean;
  onUseProbabilityLens?: () => void;
  probabilityLensActive?: boolean;
  sixthSenseArmed?: boolean;
  canUseSixthSense?: boolean;
  onToggleSixthSenseArm?: () => void;
  sixthSenseChargesRemaining?: number;
}

interface HoveredPowerUp {
  powerUp: PowerUp;
  isUsed: boolean;
  tooltipOffset: number; // clamped horizontal offset for tooltip position
  arrowOffset: number; // arrow position relative to tooltip center
  topOffset: number;
}

function RoguelikeHeader({
  floor,
  score,
  time,
  minesRemaining,
  run,
  xRayMode = false,
  canUseXRay = false,
  onToggleXRay,
  peekMode = false,
  canUsePeek = false,
  onTogglePeek,
  safePathMode = false,
  canUseSafePath = false,
  onToggleSafePath,
  defusalKitMode = false,
  canUseDefusalKit = false,
  onToggleDefusalKit,
  surveyMode = false,
  canUseSurvey = false,
  onToggleSurvey,
  surveyChargesRemaining = 0,
  mineDetectorMode = false,
  canUseMineDetector = false,
  onToggleMineDetector,
  mineDetectorScansRemaining = 0,
  densityInfo,
  canUseProbabilityLens = false,
  onUseProbabilityLens,
  probabilityLensActive = false,
  sixthSenseArmed = false,
  canUseSixthSense = false,
  onToggleSixthSenseArm,
  sixthSenseChargesRemaining = 0,
}: RoguelikeHeaderProps) {
  const [hoveredPowerUp, setHoveredPowerUp] = useState<HoveredPowerUp | null>(null);
  const [densityHovered, setDensityHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (powerUp: PowerUp, isUsed: boolean, iconElement: HTMLSpanElement) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const iconRect = iconElement.getBoundingClientRect();
    const iconCenter = iconRect.left + iconRect.width / 2;
    const containerCenter = containerRect.left + containerRect.width / 2;

    // How far the icon is from container center
    const rawOffset = iconCenter - containerCenter;

    // Clamp tooltip position so it stays in container bounds
    // Using half of max-width (360px) as estimate, with some padding
    const tooltipHalfWidth = 180;
    const maxOffset = Math.max(0, containerRect.width / 2 - tooltipHalfWidth);
    const clampedTooltipOffset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

    // Arrow offset = remaining distance to point at icon
    const arrowOffset = rawOffset - clampedTooltipOffset;

    // Calculate how far down from the container top the icon's bottom is
    const topOffset = iconRect.bottom - containerRect.top;

    setHoveredPowerUp({
      powerUp,
      isUsed,
      tooltipOffset: clampedTooltipOffset,
      arrowOffset,
      topOffset,
    });
  };

  const hasRelics = run.activePowerUps.length > 0;

  return (
    <div className="roguelike-header">
      {/* Stats Row */}
      <div className="roguelike-stats-row">
        <div className="roguelike-stat-item">
          <span className="stat-label">FLOOR</span>
          <span className="stat-value floor-value">
            {floor}/{MAX_FLOOR}
            {run.ascensionLevel > 0 && (
              <span className="ascension-badge-small">A{run.ascensionLevel}</span>
            )}
          </span>
        </div>
        <div className="roguelike-stat-item">
          <span className="stat-label">MINES</span>
          <span className="stat-value mines-value">{formatNumber(minesRemaining)}</span>
        </div>
        {densityInfo && (
          <div
            className="roguelike-stat-item density-stat"
            onMouseEnter={() => setDensityHovered(true)}
            onMouseLeave={() => setDensityHovered(false)}
          >
            <span className="stat-label">DENSITY</span>
            <span className="stat-value density-value">
              {Math.round(densityInfo.effectiveDensityPercent)}%
            </span>
            {densityHovered && (
              <div className="density-tooltip">
                <div className="density-tooltip-title">Mine Density</div>
                <div className="density-tooltip-row">
                  <span className="density-tooltip-item-label">Base</span>
                  <span className="density-tooltip-item-value">
                    {densityInfo.baseMines} mines
                  </span>
                </div>
                {densityInfo.modifiers.length > 0 && (
                  <>
                    {densityInfo.modifiers.map((mod, i) => (
                      <div key={i} className="density-tooltip-row density-tooltip-modifier">
                        <span className="density-tooltip-item-label">
                          {mod.label} (+{Math.round(mod.percent)}%)
                        </span>
                      </div>
                    ))}
                    <div className="density-tooltip-row">
                      <span className="density-tooltip-item-label">Bonus</span>
                      <span className="density-tooltip-item-value">
                        +{densityInfo.bonusMines} mines
                      </span>
                    </div>
                  </>
                )}
                <div className="density-tooltip-divider" />
                <div className="density-tooltip-row density-tooltip-total">
                  <span className="density-tooltip-item-label">Total</span>
                  <span className="density-tooltip-item-value">
                    {densityInfo.effectiveMines} mines (
                    {Math.round(densityInfo.effectiveDensityPercent)}%)
                  </span>
                </div>
                {densityInfo.projectedNextFloor && (
                  <>
                    <div className="density-tooltip-divider" />
                    <div className="density-tooltip-row density-tooltip-projection">
                      <span className="density-tooltip-item-label">
                        Next floor (+{densityInfo.projectedNextFloor.traumaBonusPercent}% trauma)
                      </span>
                      <span className="density-tooltip-item-value">
                        {Math.round(densityInfo.projectedNextFloor.effectiveDensityPercent)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <div className="roguelike-stat-item">
          <span className="stat-label">TIME</span>
          <span className="stat-value time-value">
            {formatNumber(time)}
          </span>
        </div>
        <div className="roguelike-stat-item">
          <span className="stat-label">SCORE</span>
          <span className="stat-value score-value">{formatScore(score)}</span>
        </div>
      </div>

      {/* Relics Row */}
      <div className="roguelike-relics-row" ref={containerRef}>
        {/* Empty state placeholder */}
        {!hasRelics && <span className="relics-empty">No relics yet</span>}
        {/* Shared tooltip for active relics */}
        {hoveredPowerUp && (
          <div
            className="powerup-tooltip"
            style={{
              top: `${hoveredPowerUp.topOffset + 12}px`,
              left: `calc(50% + ${hoveredPowerUp.tooltipOffset}px)`,
            }}
          >
            <div className="powerup-tooltip-header">
              <span className="powerup-tooltip-name">{hoveredPowerUp.powerUp.name}</span>
              <span className={`rarity-badge rarity-${hoveredPowerUp.powerUp.rarity}`}>
                {hoveredPowerUp.powerUp.rarity}
              </span>
              <span className={`type-badge ${hoveredPowerUp.powerUp.type}`}>
                {hoveredPowerUp.powerUp.type}
              </span>
              {hoveredPowerUp.isUsed && <span className="powerup-tooltip-status">USED</span>}
            </div>
            <span className="powerup-tooltip-desc">
              {hoveredPowerUp.powerUp.description}
              {hoveredPowerUp.powerUp.id === 'iron-will' && run.traumaStacks > 0 && (
                <span className="powerup-tooltip-trauma">
                  {'\n\n'}Trauma: {run.traumaStacks} stack{run.traumaStacks > 1 ? 's' : ''} (+
                  {run.traumaStacks * 5}% mines)
                </span>
              )}
              {hoveredPowerUp.powerUp.id === 'quick-recovery' && run.quickRecoveryUsedThisRun && (
                <span className="powerup-tooltip-trauma">{'\n\n'}Already used this run.</span>
              )}
              {hoveredPowerUp.powerUp.id === 'quick-recovery' &&
                !run.quickRecoveryUsedThisRun &&
                !run.quickRecoveryEligibleThisFloor && (
                  <span className="powerup-tooltip-trauma">
                    {'\n\n'}Too late to trigger this floor.
                  </span>
                )}
            </span>
            <span
              className="powerup-tooltip-arrow"
              style={{ left: `calc(50% + ${hoveredPowerUp.arrowOffset}px)` }}
            />
          </div>
        )}
        {/* All relics in acquisition order — maps built once, not per-powerup */}
        {(() => {
          // Built once per render, not per power-up iteration
          const usedMap: Record<string, boolean> = {
            'x-ray-vision': run.xRayUsedThisFloor,
            'peek': run.peekUsedThisFloor,
            'safe-path': run.safePathUsedThisFloor,
            'defusal-kit': run.defusalKitUsedThisFloor,
            'survey': run.surveyChargesRemaining <= 0,
            'mine-detector': run.mineDetectorScansRemaining <= 0,
            'probability-lens': run.probabilityLensUsedThisFloor,
            'sixth-sense': run.sixthSenseChargesRemaining <= 0,
            'iron-will': run.ironWillUsedThisFloor,
            'quick-recovery': run.quickRecoveryUsedThisRun || !run.quickRecoveryEligibleThisFloor,
          };

          const clickableMap: Record<string, (() => void) | undefined> = {
            'x-ray-vision': canUseXRay ? onToggleXRay : undefined,
            'peek': canUsePeek ? onTogglePeek : undefined,
            'safe-path': canUseSafePath ? onToggleSafePath : undefined,
            'defusal-kit': canUseDefusalKit ? onToggleDefusalKit : undefined,
            'survey': canUseSurvey ? onToggleSurvey : undefined,
            'mine-detector': canUseMineDetector ? onToggleMineDetector : undefined,
            'probability-lens': canUseProbabilityLens ? onUseProbabilityLens : undefined,
            'sixth-sense': canUseSixthSense ? onToggleSixthSenseArm : undefined,
          };

          const modeMap: Record<string, [string, boolean]> = {
            'x-ray-vision': ['xray', xRayMode],
            'peek': ['peek', peekMode],
            'safe-path': ['safe-path', safePathMode],
            'defusal-kit': ['defusal-kit', defusalKitMode],
            'survey': ['survey', surveyMode],
            'mine-detector': ['mine-detector', mineDetectorMode],
            'probability-lens': ['probability-lens', probabilityLensActive],
            'sixth-sense': ['sixth-sense', sixthSenseArmed],
          };

          const chargesMap: Record<string, number> = {
            'survey': surveyChargesRemaining,
            'mine-detector': mineDetectorScansRemaining,
            'sixth-sense': sixthSenseChargesRemaining,
          };

          return run.activePowerUps.map((powerUp) => {
            const id = powerUp.id;
            const isActive = powerUp.type === 'active';
            const isUsed = !!usedMap[id];
            const clickHandler = clickableMap[id];
            const isClickable = !!clickHandler;
            const mode = modeMap[id];

            const classes = [
              'powerup-icon-wrapper',
              `rarity-${powerUp.rarity}`,
              isActive ? 'type-active' : 'type-passive',
              isUsed && 'used',
              mode && mode[0],
              mode && mode[1] && `${mode[0]}-active`,
              isClickable && 'clickable',
            ].filter(Boolean).join(' ');

            return (
              <span
                key={id}
                className={classes}
                onMouseEnter={(e) => handleMouseEnter(powerUp, isUsed, e.currentTarget)}
                onMouseLeave={() => setHoveredPowerUp(null)}
                onClick={clickHandler}
              >
                <span className="powerup-icon-inner">
                  <span className="powerup-icon-emoji">{powerUp.icon}</span>
                </span>
                {isActive && <span className="active-relic-badge">⚡</span>}
                {CHARGE_BADGE_IDS[id] && (
                  <span className={`mine-detector-badge${id === 'survey' ? ' survey-badge' : ''}`}>
                    {chargesMap[id]}
                  </span>
                )}
              </span>
            );
          });
        })()}
      </div>
    </div>
  );
}

export default RoguelikeHeader;
