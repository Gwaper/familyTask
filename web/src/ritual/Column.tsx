import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { both, t } from '../i18n.ts';

export type ColumnKind = 'todo' | 'done';

const HEADER = {
  todo: { icon: '📋', text: t.todo },
  done: { icon: '🌟', text: t.done },
};

/** `action` : bouton facultatif affiché à droite de l'en-tête. */
export function Column({ kind, action, children }: { kind: ColumnKind; action?: ReactNode; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: kind });
  const { icon, text } = HEADER[kind];
  return (
    <section ref={setNodeRef} className={`column column-${kind}${isOver ? ' column-over' : ''}`}>
      <h2 className="column-head">
        <span className="column-icon" aria-hidden="true">{icon}</span>
        <span>{both(text)}</span>
        {action}
      </h2>
      <div className="column-cards">{children}</div>
    </section>
  );
}
