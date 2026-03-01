import { useState } from 'react';
import type { ActionItem, Participant, ClientMessage } from '../types';
import styles from './ActionItems.module.css';

interface ActionItemsProps {
  items: ActionItem[];
  participants: Participant[];
  onSend: (msg: ClientMessage) => void;
}

export function ActionItems({ items, participants, onSend }: ActionItemsProps) {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [customAssignee, setCustomAssignee] = useState('');

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

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Action Items</h3>

      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.id} className={item.completed ? styles.itemCompleted : styles.item}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={item.completed}
              onChange={() => onSend({ type: 'toggleAction', actionId: item.id })}
              aria-label={`Mark "${item.text}" as ${item.completed ? 'incomplete' : 'complete'}`}
            />
            <span className={styles.itemText}>{item.text}</span>
            <span className={styles.assignee}>{item.assignee}</span>
          </div>
        ))}
      </div>

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
