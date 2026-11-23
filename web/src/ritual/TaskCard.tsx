import type { MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Member, Task } from '../../../shared/types.ts';
import { Avatar, PictureView } from '../Picture.tsx';
import { say, useCanSpeak } from '../speech.ts';

interface Props {
  task: Task;
  members: Member[];
  celebrate: boolean;
  onOpen: () => void;
  onMove: () => void;
}

/** Contenu visuel d'une carte : partagé entre la carte et sa copie pendant le glisser. */
export function CardContent({ task, members, onOpen, onMove }: Omit<Props, 'celebrate'>) {
  const canSpeak = useCanSpeak();
  // Les boutons de la carte ne doivent pas ouvrir la bulle d'avatars.
  const handle = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };

  return (
    <>
      {canSpeak && (
        <button className="card-speak" onClick={handle(() => say({ fr: task.nameFr, es: task.nameEs }))} aria-label="🔊">
          🔊
        </button>
      )}
      <div className="card-main" onClick={onOpen}>
        <PictureView value={task.icon} size={96} />
        <div className="name-fr">{task.nameFr}</div>
        {task.nameEs && <div className="name-es">{task.nameEs}</div>}
        <div className="card-avatars">
          {members.length > 0
            ? members.map((m) => <Avatar key={m.id} member={m} size={52} />)
            : <span className="avatar avatar-empty" style={{ width: 52, height: 52 }}>👤</span>}
        </div>
      </div>
      <button className="card-move" onClick={handle(onMove)} aria-label={task.done ? '⬅️' : '➡️'}>
        {task.done ? '⬅️' : '➡️'}
      </button>
    </>
  );
}

export function TaskCard(props: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.task.id });
  const className = ['card', props.task.done && 'card-done', isDragging && 'card-dragging', props.celebrate && 'card-pop']
    .filter(Boolean)
    .join(' ');
  return (
    <div ref={setNodeRef} className={className} {...attributes} {...listeners}>
      <CardContent {...props} />
    </div>
  );
}
