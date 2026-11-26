import { useState, type ReactNode } from 'react';
import { Bi } from '../Bi.tsx';
import { PencilIcon, PlusIcon, TrashIcon } from '../icons.tsx';
import { both, t, type Bilingual } from '../i18n.ts';

interface Props<T extends { id: number }> {
  title: Bilingual;
  addLabel: Bilingual;
  confirmDelete: Bilingual;
  items: T[];
  renderItem: (item: T) => ReactNode;
  /** Formulaire d'ajout (item absent) ou d'édition ; `close` referme le formulaire. */
  renderForm: (item: T | undefined, close: () => void) => ReactNode;
  onDelete: (id: number) => void;
  /** Couleur des titres et du séparateur (classe CSS). */
  tone: 'tasks' | 'members';
}

/** Liste éditable commune aux tâches et aux membres : ajout, édition, suppression. */
export function ManagedList<T extends { id: number }>(props: Props<T>) {
  const { title, addLabel, confirmDelete, items, renderItem, renderForm, onDelete, tone } = props;
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const close = () => setEditing(null);

  return (
    <section className={`manage-section manage-${tone}`}>
      <h2 className="manage-title">
        <span className="manage-title-fr">{title.fr}</span>
        <span className="manage-title-es">{title.es}</span>
      </h2>
      <ul className="manage-list">
        {items.map((item) =>
          editing === item.id ? (
            <li key={item.id}>{renderForm(item, close)}</li>
          ) : (
            <li key={item.id} className="manage-item">
              <div className="manage-summary">{renderItem(item)}</div>
              <div className="manage-actions">
                <button className="icon-button icon-edit" onClick={() => setEditing(item.id)} aria-label={both(t.edit)} title={both(t.edit)}>
                  <PencilIcon />
                </button>
                <button
                  className="icon-button"
                  onClick={() => confirm(both(confirmDelete)) && onDelete(item.id)}
                  aria-label={both(t.remove)}
                  title={both(t.remove)}
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing === 'new' ? (
        renderForm(undefined, close)
      ) : (
        <button className="pill-button pill-add add-button" onClick={() => setEditing('new')}>
          <span className="pill-button-dot"><PlusIcon /></span>
          <Bi text={addLabel} />
        </button>
      )}
    </section>
  );
}
