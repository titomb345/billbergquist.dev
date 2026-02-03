import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RunState, PowerUp } from '../types';
import { MAX_FLOOR } from '../constants';
import { getAscensionModifiers } from '../ascension';

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
  surveyResult?: { direction: 'row' | 'col'; index: number; mineCount: number } | null;
  mineDetectorCount?: number | null;
  zeroCellCount?: number | null;
}

interface HoveredPowerUp {
  powerUp: PowerUp;
  isUsed: boolean;
  arrowOffset: number;
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
  surveyResult,
  mineDetectorCount,
  zeroCellCount,
}: RoguelikeHeaderProps) {
  const [hoveredPowerUp, setHoveredPowerUp] = useState<HoveredPowerUp | null>(null);
  const [passivePopoverOpen, setPassivePopoverOpen] = useState(false);
  const [hoveredPassive, setHoveredPassive] = useState<PowerUp | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const passiveBadgeRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Split power-ups into active and passive
  const { activeRelics, passiveRelics } = useMemo(() => {
    const active: PowerUp[] = [];
    const passive: PowerUp[] = [];
    for (const powerUp of run.activePowerUps) {
      if (powerUp.type === 'active') {
        active.push(powerUp);
      } else {
        passive.push(powerUp);
      }
    }
    return { activeRelics: active, passiveRelics: passive };
  }, [run.activePowerUps]);

  // Handle popover close with delay to prevent flicker
  const handlePopoverMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handlePopoverMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setPassivePopoverOpen(false);
      setHoveredPassive(null);
    }, 150);
  }, []);

  const handleBadgeMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setPassivePopoverOpen(true);
  }, []);

  const handleBadgeMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setPassivePopoverOpen(false);
      setHoveredPassive(null);
    }, 150);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

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
    const arrowOffset = iconCenter - containerCenter;
    // Calculate how far down from the container top the icon's bottom is
    const topOffset = iconRect.bottom - containerRect.top;

    setHoveredPowerUp({ powerUp, isUsed, arrowOffset, topOffset });
  };

  const hasRelics = activeRelics.length > 0 || passiveRelics.length > 0;

  // A2: Check if timer is in countdown mode and low
  const modifiers = getAscensionModifiers(run.ascensionLevel);
  const isCountdownMode = modifiers.timerCountdown !== null;
  const isTimerLow = isCountdownMode && time < 30;

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
          <span className="stat-label">{isCountdownMode ? 'LEFT' : 'TIME'}</span>
          <span className={`stat-value time-value ${isTimerLow ? 'timer-warning' : ''}`}>
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
            style={{ top: `${hoveredPowerUp.topOffset + 12}px` }}
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
            <span className="powerup-tooltip-desc">{hoveredPowerUp.powerUp.description}</span>
            <span
              className="powerup-tooltip-arrow"
              style={{ left: `calc(50% + ${hoveredPowerUp.arrowOffset}px)` }}
            />
          </div>
        )}
        {/* Active relic icons */}
        {activeRelics.map((powerUp) => {
          const isXRay = powerUp.id === 'x-ray-vision';
          const isXRayUsed = isXRay && run.xRayUsedThisFloor;
          const isPeek = powerUp.id === 'peek';
          const isPeekUsed = isPeek && run.peekUsedThisFloor;
          const isSafePath = powerUp.id === 'safe-path';
          const isSafePathUsed = isSafePath && run.safePathUsedThisFloor;
          const isDefusalKit = powerUp.id === 'defusal-kit';
          const isDefusalKitUsed = isDefusalKit && run.defusalKitUsedThisFloor;
          const isSurvey = powerUp.id === 'survey';
          const isSurveyUsed = isSurvey && run.surveyUsedThisFloor;
          const isUsed =
            isXRayUsed || isPeekUsed || isSafePathUsed || isDefusalKitUsed || isSurveyUsed;
          const isXRayClickable = isXRay && canUseXRay && onToggleXRay;
          const isPeekClickable = isPeek && canUsePeek && onTogglePeek;
          const isSafePathClickable = isSafePath && canUseSafePath && onToggleSafePath;
          const isDefusalKitClickable = isDefusalKit && canUseDefusalKit && onToggleDefusalKit;
          const isSurveyClickable = isSurvey && canUseSurvey && onToggleSurvey;
          const isClickable =
            isXRayClickable ||
            isPeekClickable ||
            isSafePathClickable ||
            isDefusalKitClickable ||
            isSurveyClickable;
          const showSurveyResult = isSurvey && surveyResult != null;

          const getClickHandler = () => {
            if (isXRayClickable) return onToggleXRay;
            if (isPeekClickable) return onTogglePeek;
            if (isSafePathClickable) return onToggleSafePath;
            if (isDefusalKitClickable) return onToggleDefusalKit;
            if (isSurveyClickable) return onToggleSurvey;
            return undefined;
          };

          return (
            <span
              key={powerUp.id}
              className={`powerup-icon-wrapper rarity-${powerUp.rarity} ${isUsed ? 'used' : ''} ${isXRay ? 'xray' : ''} ${xRayMode ? 'xray-active' : ''} ${isPeek ? 'peek' : ''} ${peekMode ? 'peek-active' : ''} ${isSafePath ? 'safe-path' : ''} ${safePathMode ? 'safe-path-active' : ''} ${isDefusalKit ? 'defusal-kit' : ''} ${defusalKitMode ? 'defusal-kit-active' : ''} ${isSurvey ? 'survey' : ''} ${surveyMode ? 'survey-active' : ''} ${isClickable ? 'clickable' : ''} ${showSurveyResult ? 'detector-active' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(powerUp, isUsed, e.currentTarget)}
              onMouseLeave={() => setHoveredPowerUp(null)}
              onClick={getClickHandler()}
            >
              <span className="powerup-icon-emoji">{powerUp.icon}</span>
              {showSurveyResult && (
                <span className="mine-detector-badge survey-badge">{surveyResult.mineCount}</span>
              )}
            </span>
          );
        })}
        {/* Passive relics badge */}
        {passiveRelics.length > 0 && (
          <span
            ref={passiveBadgeRef}
            className="passive-badge"
            onMouseEnter={handleBadgeMouseEnter}
            onMouseLeave={handleBadgeMouseLeave}
            onClick={() => setPassivePopoverOpen((prev) => !prev)}
          >
            +{passiveRelics.length}
          </span>
        )}
        {/* Passive relics popover */}
        {passivePopoverOpen && passiveRelics.length > 0 && (
          <div
            ref={popoverRef}
            className="passive-popover"
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <span className="passive-popover-title">PASSIVE RELICS</span>
            <div className="passive-popover-grid">
              {passiveRelics.map((powerUp) => {
                const isIronWillUsed = !run.ironWillAvailable && powerUp.id === 'iron-will';
                const isQuickRecoveryUsed =
                  powerUp.id === 'quick-recovery' && run.quickRecoveryUsedThisRun;
                const isUsed = isIronWillUsed || isQuickRecoveryUsed;
                const isMineDetector = powerUp.id === 'mine-detector';
                const isFloorScout = powerUp.id === 'floor-scout';
                const showDetectorCount = isMineDetector && mineDetectorCount != null;
                const showZeroCellCount = isFloorScout && zeroCellCount != null;

                return (
                  <span
                    key={powerUp.id}
                    className={`passive-popover-icon rarity-${powerUp.rarity} ${isUsed ? 'used' : ''} ${hoveredPassive?.id === powerUp.id ? 'hovered' : ''} ${showDetectorCount || showZeroCellCount ? 'detector-active' : ''}`}
                    onMouseEnter={() => setHoveredPassive(powerUp)}
                  >
                    <span className="powerup-icon-emoji">{powerUp.icon}</span>
                    {showDetectorCount && (
                      <span className="mine-detector-badge">{mineDetectorCount}</span>
                    )}
                    {showZeroCellCount && (
                      <span className="mine-detector-badge floor-scout-badge">{zeroCellCount}</span>
                    )}
                  </span>
                );
              })}
            </div>
            {hoveredPassive && (
              <div className="passive-popover-detail">
                <div className="passive-popover-detail-header">
                  <span className="passive-popover-detail-name">{hoveredPassive.name}</span>
                  <span className={`rarity-badge rarity-${hoveredPassive.rarity}`}>
                    {hoveredPassive.rarity}
                  </span>
                  {(() => {
                    const isIronWillUsed =
                      !run.ironWillAvailable && hoveredPassive.id === 'iron-will';
                    const isQuickRecoveryUsed =
                      hoveredPassive.id === 'quick-recovery' && run.quickRecoveryUsedThisRun;
                    const isUsed = isIronWillUsed || isQuickRecoveryUsed;
                    return isUsed ? (
                      <span className="passive-popover-detail-status">USED</span>
                    ) : null;
                  })()}
                </div>
                <span className="passive-popover-detail-desc">{hoveredPassive.description}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoguelikeHeader;
