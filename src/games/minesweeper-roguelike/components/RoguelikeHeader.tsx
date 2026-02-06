import { useState, useRef } from 'react';
import { RunState, PowerUp } from '../types';
import { MAX_FLOOR } from '../constants';

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
  zeroCellCount?: number | null;
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
  zeroCellCount,
  canUseProbabilityLens = false,
  onUseProbabilityLens,
  probabilityLensActive = false,
  sixthSenseArmed = false,
  canUseSixthSense = false,
  onToggleSixthSenseArm,
  sixthSenseChargesRemaining = 0,
}: RoguelikeHeaderProps) {
  const [hoveredPowerUp, setHoveredPowerUp] = useState<HoveredPowerUp | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        {/* All relics in acquisition order */}
        {run.activePowerUps.map((powerUp) => {
          const isActive = powerUp.type === 'active';
          const isXRay = powerUp.id === 'x-ray-vision';
          const isXRayUsed = isXRay && run.xRayUsedThisFloor;
          const isPeek = powerUp.id === 'peek';
          const isPeekUsed = isPeek && run.peekUsedThisFloor;
          const isSafePath = powerUp.id === 'safe-path';
          const isSafePathUsed = isSafePath && run.safePathUsedThisFloor;
          const isDefusalKit = powerUp.id === 'defusal-kit';
          const isDefusalKitUsed = isDefusalKit && run.defusalKitUsedThisFloor;
          const isSurvey = powerUp.id === 'survey';
          const isSurveyUsed = isSurvey && run.surveyChargesRemaining <= 0;
          const isMineDetector = powerUp.id === 'mine-detector';
          const isMineDetectorUsed = isMineDetector && run.mineDetectorScansRemaining <= 0;
          const isProbabilityLens = powerUp.id === 'probability-lens';
          const isProbabilityLensUsed = isProbabilityLens && run.probabilityLensUsedThisFloor;
          const isSixthSense = powerUp.id === 'sixth-sense';
          const isSixthSenseUsed = isSixthSense && run.sixthSenseChargesRemaining <= 0;
          // Check per-floor usage instead of run-wide availability
          const isIronWillUsed = run.ironWillUsedThisFloor && powerUp.id === 'iron-will';
          const isQuickRecoveryUsed =
            powerUp.id === 'quick-recovery' &&
            (run.quickRecoveryUsedThisRun || !run.quickRecoveryEligibleThisFloor);
          const isUsed =
            isXRayUsed ||
            isPeekUsed ||
            isSafePathUsed ||
            isDefusalKitUsed ||
            isSurveyUsed ||
            isMineDetectorUsed ||
            isProbabilityLensUsed ||
            isSixthSenseUsed ||
            isIronWillUsed ||
            isQuickRecoveryUsed;

          const isXRayClickable = isXRay && canUseXRay && onToggleXRay;
          const isPeekClickable = isPeek && canUsePeek && onTogglePeek;
          const isSafePathClickable = isSafePath && canUseSafePath && onToggleSafePath;
          const isDefusalKitClickable = isDefusalKit && canUseDefusalKit && onToggleDefusalKit;
          const isSurveyClickable = isSurvey && canUseSurvey && onToggleSurvey;
          const isMineDetectorClickable =
            isMineDetector && canUseMineDetector && onToggleMineDetector;
          const isProbabilityLensClickable =
            isProbabilityLens && canUseProbabilityLens && onUseProbabilityLens;
          const isSixthSenseClickable = isSixthSense && canUseSixthSense && onToggleSixthSenseArm;
          const isClickable =
            isXRayClickable ||
            isPeekClickable ||
            isSafePathClickable ||
            isDefusalKitClickable ||
            isSurveyClickable ||
            isMineDetectorClickable ||
            isProbabilityLensClickable ||
            isSixthSenseClickable;

          const showSurveyBadge = isSurvey;
          const isFloorScout = powerUp.id === 'floor-scout';
          const showMineDetectorBadge = isMineDetector;
          const showZeroCellCount = isFloorScout && zeroCellCount != null;
          const showSixthSenseBadge = isSixthSense;

          const getClickHandler = () => {
            if (isXRayClickable) return onToggleXRay;
            if (isPeekClickable) return onTogglePeek;
            if (isSafePathClickable) return onToggleSafePath;
            if (isDefusalKitClickable) return onToggleDefusalKit;
            if (isSurveyClickable) return onToggleSurvey;
            if (isMineDetectorClickable) return onToggleMineDetector;
            if (isProbabilityLensClickable) return onUseProbabilityLens;
            if (isSixthSenseClickable) return onToggleSixthSenseArm;
            return undefined;
          };

          return (
            <span
              key={powerUp.id}
              className={`powerup-icon-wrapper rarity-${powerUp.rarity} ${isUsed ? 'used' : ''} ${isXRay ? 'xray' : ''} ${xRayMode ? 'xray-active' : ''} ${isPeek ? 'peek' : ''} ${peekMode ? 'peek-active' : ''} ${isSafePath ? 'safe-path' : ''} ${safePathMode ? 'safe-path-active' : ''} ${isDefusalKit ? 'defusal-kit' : ''} ${defusalKitMode ? 'defusal-kit-active' : ''} ${isSurvey ? 'survey' : ''} ${surveyMode ? 'survey-active' : ''} ${isMineDetector ? 'mine-detector' : ''} ${mineDetectorMode ? 'mine-detector-active' : ''} ${isProbabilityLens ? 'probability-lens' : ''} ${probabilityLensActive ? 'probability-lens-active' : ''} ${isSixthSense ? 'sixth-sense' : ''} ${isSixthSense && sixthSenseArmed ? 'sixth-sense-active' : ''} ${isClickable ? 'clickable' : ''} ${showZeroCellCount ? 'detector-active' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(powerUp, isUsed, e.currentTarget)}
              onMouseLeave={() => setHoveredPowerUp(null)}
              onClick={getClickHandler()}
            >
              <span className="powerup-icon-inner">
                <span className="powerup-icon-emoji">{powerUp.icon}</span>
              </span>
              {/* Lightning badge for active-type relics */}
              {isActive && <span className="active-relic-badge">⚡</span>}
              {showSurveyBadge && (
                <span className="mine-detector-badge survey-badge">{surveyChargesRemaining}</span>
              )}
              {showMineDetectorBadge && (
                <span className="mine-detector-badge">{mineDetectorScansRemaining}</span>
              )}
              {showZeroCellCount && (
                <span className="mine-detector-badge floor-scout-badge">{zeroCellCount}</span>
              )}
              {showSixthSenseBadge && (
                <span className="mine-detector-badge">{sixthSenseChargesRemaining}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default RoguelikeHeader;
