import { useState, type ReactNode } from 'react';
import { moveItem } from '../board.ts';
import { both, t, type Bilingual } from '../i18n.ts';

interface Props<T extends { id: number }> {
  title: Bilingual;
  addLabel: Bilingual;
  confirmDelete: Bilingual;
  items: T[];
  renderItem: (item: T) => ReactNode;
  /** Formulaire d'ajout (item absent) ou d'édition ; `close` referme le formulaire. */
  renderForm: (item: T | undefined, close: () => void) => ReactNode;
  onReorder: (ids: number[]) => void;
  onDelete: (id: number) => void;
}

/** Liste éditable commune aux tâches et aux membres : ajout, édition, ordre, suppression. */
export function ManagedList<T extends { id: number }>(props: Props<T>) {
  const { title, addLabel, confirmDelete, items, renderItem, renderForm, onReorder, onDelete } = props;
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const close = () => setEditing(null);

  const move = (index: number, delta: number) => {
    const next = moveItem(items, index, delta);
    if (next !== items) onReorder(next.map((item) => item.id));
  };

  return (
    <section className="manage-section">
      <h2>{both(title)}</h2>
      <ul className="manage-list">
        {items.map((item, index) =>
          editing === item.id ? (
            <li key={item.id}>{renderForm(item, close)}</li>
          ) : (
            <li key={item.id} className="manage-item">
              <div className="manage-summary">{renderItem(item)}</div>
              <div className="manage-actions">
                <button onClick={() => move(index, -1)} disabled={index === 0} title={both(t.moveUp)}>▲</button>
                <button onClick={() => move(index, 1)} disabled={index === items.length - 1} title={both(t.moveDown)}>▼</button>
                <button onClick={() => setEditing(item.id)} title={both(t.edit)}>✏️</button>
                <button onClick={() => confirm(both(confirmDelete)) && onDelete(item.id)} title={both(t.remove)}>🗑️</button>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing === 'new'
        ? renderForm(undefined, close)
        : <button className="primary add-button" onClick={() => setEditing('new')}>➕ {both(addLabel)}</button>}
    </section>
  );
}
