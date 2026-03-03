import { useState } from 'react';
import type { Column } from '../types';
import { COLUMN_TEMPLATES, COLUMN_CSS_MAP } from '../constants';
import styles from './ColumnTemplateSelector.module.css';

interface ColumnTemplateSelectorProps {
  selectedColumns: Column[];
  onChange: (columns: Column[]) => void;
}

const COLORS: Array<Column['color']> = ['mint', 'magenta', 'orange', 'purple', 'yellow'];

export function ColumnTemplateSelector({ selectedColumns: _selectedColumns, onChange }: ColumnTemplateSelectorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [customColumns, setCustomColumns] = useState<Column[]>([
    { id: 'col-1', label: '', color: 'mint' },
    { id: 'col-2', label: '', color: 'magenta' },
    { id: 'col-3', label: '', color: 'orange' },
  ]);

  const isCustom = activeIndex === COLUMN_TEMPLATES.length - 1;

  const selectTemplate = (index: number) => {
    setActiveIndex(index);
    const template = COLUMN_TEMPLATES[index];
    if (template.name === 'Custom') {
      onChange(customColumns);
    } else {
      onChange(template.columns);
    }
  };

  const updateCustomColumn = (idx: number, field: 'label' | 'color', value: string) => {
    const next = customColumns.map((col, i) =>
      i === idx ? { ...col, [field]: value } : col,
    );
    setCustomColumns(next);
    onChange(next);
  };

  const addCustomColumn = () => {
    if (customColumns.length >= 5) return;
    const nextId = `col-${customColumns.length + 1}`;
    const nextColor = COLORS[customColumns.length % COLORS.length];
    const next = [...customColumns, { id: nextId, label: '', color: nextColor }];
    setCustomColumns(next);
    onChange(next);
  };

  const removeCustomColumn = (idx: number) => {
    if (customColumns.length <= 1) return;
    const next = customColumns.filter((_, i) => i !== idx);
    setCustomColumns(next);
    onChange(next);
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Template</label>
      <div className={styles.templates}>
        {COLUMN_TEMPLATES.map((template, i) => (
          <button
            key={template.name}
            className={i === activeIndex ? styles.templateCardActive : styles.templateCard}
            onClick={() => selectTemplate(i)}
            type="button"
          >
            <span className={styles.templateName}>{template.name}</span>
            {template.columns.length > 0 && (
              <div className={styles.colorDots}>
                {template.columns.map((col) => (
                  <span
                    key={col.id}
                    className={styles.colorDot}
                    style={{ background: COLUMN_CSS_MAP[col.color] }}
                  />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className={styles.customEditor}>
          {customColumns.map((col, i) => (
            <div key={col.id} className={styles.customRow}>
              <input
                className={styles.customInput}
                type="text"
                value={col.label}
                onChange={(e) => updateCustomColumn(i, 'label', e.target.value)}
                placeholder={`Column ${i + 1}`}
                maxLength={40}
              />
              <div className={styles.colorPicker}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={col.color === c ? styles.colorSwatchActive : styles.colorSwatch}
                    style={{ background: COLUMN_CSS_MAP[c] }}
                    onClick={() => updateCustomColumn(i, 'color', c)}
                    aria-label={c}
                  />
                ))}
              </div>
              {customColumns.length > 1 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeCustomColumn(i)}
                  aria-label="Remove column"
                >
                  x
                </button>
              )}
            </div>
          ))}
          {customColumns.length < 5 && (
            <button type="button" className={styles.addColumnBtn} onClick={addCustomColumn}>
              + Add Column
            </button>
          )}
        </div>
      )}
    </div>
  );
}
