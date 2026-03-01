import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Card, CardGroup, Column, ClientMessage } from '../types';
import { StickyNote } from './StickyNote';
import styles from './GroupPhase.module.css';

interface GroupPhaseProps {
  cards: Card[];
  groups: CardGroup[];
  columns: Column[];
  onSend: (msg: ClientMessage) => void;
}

// ── Droppable zone that wraps a draggable card ──

interface DraggableCardProps {
  card: Card;
  columnColor: string;
  inGroup: boolean;
  onSend: (msg: ClientMessage) => void;
}

function DraggableCard({ card, columnColor, inGroup, onSend }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: card.id });

  // Droppable uses a prefixed ID to avoid collision with the draggable ID
  const droppableId = `drop-${card.id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: droppableId });

  const dragClassName = [
    styles.draggableCard,
    isDragging ? styles.draggableCardDragging : '',
    isOver ? styles.draggableCardOver : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={setDropRef} className={styles.droppableZone}>
      <div
        ref={setDragRef}
        className={dragClassName}
        {...listeners}
        {...attributes}
      >
        <StickyNote
          card={card}
          columnColor={columnColor}
          phase="group"
          canVote={false}
          canDelete={false}
          isPrivate={false}
          onSend={onSend}
        />
        {inGroup && (
          <button
            className={styles.ungroupBtn}
            onClick={(e) => {
              e.stopPropagation();
              onSend({ type: 'ungroupCard', cardId: card.id });
            }}
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}

// ── Card Cluster (rendered group) ──

interface CardClusterProps {
  group: CardGroup;
  cards: Card[];
  columns: Column[];
  onSend: (msg: ClientMessage) => void;
}

function CardCluster({ group, cards, columns, onSend }: CardClusterProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `group-${group.id}` });
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(group.label ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed !== (group.label ?? '')) {
      onSend({ type: 'setGroupLabel', groupId: group.id, label: trimmed });
    }
    setEditing(false);
  };

  const getColumnColor = (columnId: string) => {
    return columns.find((c) => c.id === columnId)?.color ?? 'mint';
  };

  const displayLabel = group.label?.trim() || 'Untitled group';

  return (
    <div ref={setNodeRef} className={isOver ? styles.clusterOver : styles.cluster}>
      <div className={styles.clusterHeader}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.clusterLabelInput}
            type="text"
            placeholder="Group name..."
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') {
                setEditText(group.label ?? '');
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            className={group.label?.trim() ? styles.clusterLabel : styles.clusterLabelEmpty}
            onClick={() => {
              setEditText(group.label ?? '');
              setEditing(true);
            }}
          >
            {displayLabel}
          </button>
        )}
        <span className={styles.clusterCount}>{cards.length} cards</span>
        <button
          className={styles.dissolveBtn}
          onClick={() => onSend({ type: 'dissolveGroup', groupId: group.id })}
        >
          Ungroup all
        </button>
      </div>
      {cards.map((card) => (
        <DraggableCard
          key={card.id}
          card={card}
          columnColor={getColumnColor(card.columnId)}
          inGroup={true}
          onSend={onSend}
        />
      ))}
    </div>
  );
}

// ── Group Phase ──

export function GroupPhase({ cards, groups, columns, onSend }: GroupPhaseProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const getColumnColor = useCallback(
    (columnId: string) => columns.find((c) => c.id === columnId)?.color ?? 'mint',
    [columns],
  );

  // Ungrouped cards sorted by column order (well → didn't → improvements)
  const ungroupedCards = useMemo(() => {
    const colOrder = new Map(columns.map((col, i) => [col.id, i]));
    return cards
      .filter((c) => !c.groupId)
      .sort((a, b) => (colOrder.get(a.columnId) ?? 0) - (colOrder.get(b.columnId) ?? 0));
  }, [cards, columns]);

  const activeCard = useMemo(
    () => (activeCardId ? cards.find((c) => c.id === activeCardId) ?? null : null),
    [activeCardId, cards],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedCardId = event.active.id as string;
    // Use tracked overId from onDragOver — event.over can be null
    // when DragOverlay captures the pointer at release time
    const targetId = overId ?? (event.over?.id as string | null);

    setActiveCardId(null);
    setOverId(null);

    if (!targetId) return;

    // Ignore self-drop
    if (targetId === `drop-${draggedCardId}`) return;

    // Target is a group drop zone — add dragged card to that group
    if (targetId.startsWith('group-')) {
      const groupId = targetId.replace('group-', '');
      const group = groups.find((g) => g.id === groupId);
      if (group && group.cardIds.length > 0) {
        onSend({ type: 'groupCards', cardIds: [draggedCardId, group.cardIds[0]] });
      }
      return;
    }

    // Target is another card's droppable zone (prefixed with "drop-")
    if (targetId.startsWith('drop-')) {
      const targetCardId = targetId.replace('drop-', '');
      onSend({ type: 'groupCards', cardIds: [draggedCardId, targetCardId] });
    }
  };

  const handleDragCancel = () => {
    setActiveCardId(null);
    setOverId(null);
  };

  return (
    <div className={styles.groupPhase}>
      <p className={styles.instructions}>
        Drag cards onto each other to group related topics across categories.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={styles.scrollContainer}>
          {/* ── Groups ── */}
          {groups.length > 0 && (
            <div className={styles.groupsSection}>
              <div className={styles.groupsSectionHeader}>
                <span className={styles.groupsSectionTitle}>Groups</span>
                <span className={styles.groupsSectionCount}>{groups.length}</span>
              </div>
              {groups.map((group) => {
                const groupCards = group.cardIds
                  .map((id) => cards.find((c) => c.id === id))
                  .filter((c): c is Card => c != null);

                return (
                  <CardCluster
                    key={group.id}
                    group={group}
                    cards={groupCards}
                    columns={columns}
                    onSend={onSend}
                  />
                );
              })}
            </div>
          )}

          {/* ── Ungrouped cards (flat list) ── */}
          {ungroupedCards.length > 0 && (
            <div className={styles.cardsList}>
              {ungroupedCards.map((card) => (
                <DraggableCard
                  key={card.id}
                  card={card}
                  columnColor={getColumnColor(card.columnId)}
                  inGroup={false}
                  onSend={onSend}
                />
              ))}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className={styles.dragOverlay}>
              <StickyNote
                card={activeCard}
                columnColor={getColumnColor(activeCard.columnId)}
                phase="group"
                canVote={false}
                      canDelete={false}
                isPrivate={false}
                onSend={onSend}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
