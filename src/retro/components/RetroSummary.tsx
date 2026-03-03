import { useState, useEffect, useRef, useMemo } from 'react';
import type { RoomState } from '../types';
import { COLUMN_CSS_MAP } from '../constants';
import { computeVotableUnits, sortVotableUnits } from '../utils/votableUnits';
import { getAvatarColor, getInitials } from '../utils/avatar';
import styles from './RetroSummary.module.css';

interface RetroSummaryProps {
  room: RoomState;
}

function useAnimatedCounter(target: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target === 0) return;

    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return '< 1 min';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

const MEDAL_COLORS = ['#f59e0b', '#b0b0c0', '#ff6a00'];

const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  shape: i % 3 as 0 | 1 | 2,
  left: `${Math.random() * 100}%`,
  animDelay: `${Math.random() * 3}s`,
  animDuration: `${2.5 + Math.random() * 3}s`,
  rotation: `rotate(${Math.random() * 360}deg)`,
  swayDelay: `${Math.random() * 2}s`,
}));

export function RetroSummary({ room }: RetroSummaryProps) {
  const participants = room.participants;
  const topItems = useMemo(() => {
    const units = sortVotableUnits(computeVotableUnits(room.cards, room.groups));
    return units.slice(0, 3).filter((u) => {
      const votes = u.type === 'single' ? u.card.votes : (u.cards[0]?.votes ?? 0);
      return votes > 0;
    });
  }, [room.cards, room.groups]);

  const columnBreakdown = useMemo(() => {
    return room.columns.map((col) => ({
      label: col.label,
      color: col.color,
      count: room.cards.filter((c) => c.columnId === col.id).length,
    }));
  }, [room.columns, room.cards]);

  const duration = useMemo(() => {
    const start = room.startedAt ?? room.createdAt;
    const end = room.endedAt ?? Date.now();
    return formatDuration(end - start);
  }, [room.startedAt, room.endedAt, room.createdAt]);

  const stats = {
    cards: room.cards.length,
    groups: room.groups.length,
    votes: room.votes.length,
    actions: room.actionItems.length,
  };

  const animCards = useAnimatedCounter(stats.cards, 1200, 400);
  const animGroups = useAnimatedCounter(stats.groups, 1200, 550);
  const animVotes = useAnimatedCounter(stats.votes, 1200, 700);
  const animActions = useAnimatedCounter(stats.actions, 1200, 850);

  let si = 0;
  const stagger = () => ({ '--stagger-delay': `${si++ * 150 + 200}ms` }) as React.CSSProperties;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Confetti */}
        <div className={styles.confetti} aria-hidden="true">
          {CONFETTI_PIECES.map((piece, i) => (
            <span
              key={i}
              className={`${styles.confettiPiece}${piece.shape === 1 ? ` ${styles.confettiCircle}` : piece.shape === 2 ? ` ${styles.confettiRect}` : ''}`}
              style={{
                left: piece.left,
                animationDelay: `${piece.animDelay}, ${piece.swayDelay}`,
                animationDuration: piece.animDuration,
                transform: piece.rotation,
              }}
            />
          ))}
        </div>

        <h2 className={styles.title}>Retro Complete</h2>
        <p className={styles.duration}>{duration}</p>

        {/* Stats row */}
        <div className={styles.staggerSection} style={stagger()}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{animCards}</span>
              <span className={styles.statLabel}>Cards</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{animGroups}</span>
              <span className={styles.statLabel}>Groups</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{animVotes}</span>
              <span className={styles.statLabel}>Votes</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{animActions}</span>
              <span className={styles.statLabel}>Actions</span>
            </div>
          </div>

          {/* Column breakdown */}
          <div className={styles.columnBreakdown}>
            {columnBreakdown.map((col) => (
              <span
                key={col.label}
                className={styles.columnPill}
                style={{ '--col-color': COLUMN_CSS_MAP[col.color] ?? 'var(--text-muted)' } as React.CSSProperties}
              >
                <span className={styles.columnPillCount}>{col.count}</span>
                {col.label}
              </span>
            ))}
          </div>
        </div>

        {/* Top voted */}
        {topItems.length > 0 && (
          <div className={styles.staggerSection} style={stagger()}>
            <div className={styles.divider} />
            <div className={styles.section}>
              <h3 className={styles.sectionTitle} style={{ color: 'var(--neon-orange)', textShadow: '0 0 8px var(--neon-orange-glow)' }}>Top Voted</h3>
              <ol className={styles.topList}>
                {topItems.map((unit, i) => {
                  const label =
                    unit.type === 'group'
                      ? unit.group.label || unit.cards.map((c) => c.text).join(', ')
                      : unit.card.text;
                  const votes = unit.type === 'single' ? unit.card.votes : (unit.cards[0]?.votes ?? 0);

                  const isGroup = unit.type === 'group';

                  return (
                    <li key={i} className={styles.topItem}>
                      <span
                        className={styles.topRank}
                        style={{ '--medal-color': MEDAL_COLORS[i] } as React.CSSProperties}
                      >
                        {i + 1}
                      </span>
                      <span className={styles.topText}>{label}</span>
                      {isGroup && <span className={styles.groupTag}>group</span>}
                      <span className={styles.topVotes}>{votes}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        {/* Action items */}
        {room.actionItems.length > 0 && (
          <div className={styles.staggerSection} style={stagger()}>
            <div className={styles.divider} />
            <div className={styles.section}>
              <h3 className={styles.sectionTitle} style={{ color: 'var(--neon-mint)', textShadow: '0 0 8px var(--neon-mint-glow)' }}>Action Items</h3>
              <ul className={styles.actionList}>
                {room.actionItems.map((action) => (
                  <li key={action.id} className={styles.actionItem}>
                    <span className={styles.actionCheck}>&#x2713;</span>
                    <span className={styles.actionText}>{action.text}</span>
                    {action.assignee && (
                      <span className={styles.actionAssignee}>{action.assignee}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Participants */}
        <div className={styles.staggerSection} style={stagger()}>
          <div className={styles.divider} />
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ color: 'var(--neon-magenta)', textShadow: '0 0 8px var(--neon-magenta-glow)' }}>Participants</h3>
            <div className={styles.participantStack}>
              {participants.map((p, i) => (
                <div
                  key={p.id}
                  className={styles.stackAvatar}
                  style={{ zIndex: participants.length - i }}
                  title={p.name}
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className={styles.stackAvatarImg} width={36} height={36} />
                  ) : (
                    <span
                      className={styles.stackAvatarInitials}
                      style={{ background: getAvatarColor(p.id) }}
                    >
                      {getInitials(p.name)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.participantNames}>
              {participants.map((p) => (
                <span key={p.id} className={styles.participantName}>
                  {p.name}
                  {p.id === room.hostId && <span className={styles.hostTag}>host</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
