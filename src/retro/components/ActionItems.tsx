import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ActionItem, Participant, ClientMessage } from '../types';
import styles from './ActionItems.module.css';

interface SortableActionItemProps {
  item: ActionItem;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

function SortableActionItem({ item, onDelete, onEdit }: SortableActionItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text) {
      onEdit(item.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.item}>
      <span className={styles.dragHandle} {...attributes} {...listeners} aria-label="Drag to reorder">
        {'\u2630'}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          className={styles.editInput}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') { setEditText(item.text); setEditing(false); }
          }}
          maxLength={500}
        />
      ) : (
        <span
          className={styles.itemText}
          onClick={() => { setEditText(item.text); setEditing(true); }}
        >
          {item.text}
        </span>
      )}
      <span className={styles.assignee}>{item.assignee}</span>
      <button
        className={styles.deleteActionBtn}
        onClick={() => onDelete(item.id)}
        aria-label="Delete action item"
      >
        x
      </button>
    </div>
  );
}

interface ActionItemsProps {
  items: ActionItem[];
  participants: Participant[];
  onSend: (msg: ClientMessage) => void;
}

export function ActionItems({ items, participants, onSend }: ActionItemsProps) {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [customAssignee, setCustomAssignee] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const isOther = assignee === '__other__';
  const resolvedAssignee = isOther ? customAssignee.trim() : assignee;

  const handleAdd = () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    onSend({ type: 'addAction', text: trimmedText, assignee: resolvedAssignee || 'Unassigned' });
    setText('');
    setAssignee('');
    setCustomAssignee('');
  };

  const handleDelete = (actionId: string) => {
    onSend({ type: 'deleteAction', actionId });
  };

  const handleEdit = (actionId: string, newText: string) => {
    onSend({ type: 'editAction', actionId, text: newText });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    onSend({ type: 'reorderActions', actionIds: reordered.map((i) => i.id) });
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Action Items</h3>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {items.map((item) => (
              <SortableActionItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className={styles.addForm}>
        <input
          className={styles.addInput}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Action item..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <select
          className={styles.assigneeSelect}
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          <option value="">Assignee</option>
          <option value="Everyone">Everyone</option>
          {participants.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
          <option value="__other__">Other...</option>
        </select>
        {isOther && (
          <input
            className={styles.assigneeInput}
            type="text"
            value={customAssignee}
            onChange={(e) => setCustomAssignee(e.target.value)}
            placeholder="Name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
        )}
        <button className={styles.addBtn} onClick={handleAdd} disabled={!text.trim()} aria-label="Add action item">
          Add
        </button>
      </div>
    </div>
  );
}
