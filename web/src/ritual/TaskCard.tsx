import type { CSSProperties, MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Member, Task } from '../../../shared/types.ts';
import { both, t } from '../i18n.ts';
import { Avatar, PictureView } from '../Picture.tsx';
import { say, useCanSpeak } from '../speech.ts';
import { ArrowIcon, CheckIcon, PersonIcon, SpeakIcon } from './icons.tsx';
import { postIt } from './postit.ts';

interface Props {
  task: Task;
  members: Member[];
  celebrate: boolean;
  onOpen: () => void;
  onMove: () => void;
}

/** Couleur et inclinaison du post-it, passées au CSS par des variables. */
export function postItStyle(taskId: number): CSSProperties {
  const { paper, tilt, tape } = postIt(taskId);
  return { '--paper': paper, '--tilt': `${tilt}deg`, '--tape': `${tape}deg` } as CSSProperties;
}

/** Contenu visuel d'une carte : partagé entre la carte et sa copie pendant le glisser. */
export function CardContent({ task, members, onOpen, onMove }: Omit<Props, 'celebrate'>) {
  const canSpeak = useCanSpeak();
  // Les boutons de la carte ne doivent pas ouvrir la bulle d'avatars.
  const handle = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };
  const moveLabel = both(task.done ? t.todo : t.done);

  return (
    <div className="card-main" onClick={onOpen}>
      {canSpeak && (
        <button className="card-speak" onClick={handle(() => say({ fr: task.nameFr, es: task.nameEs }))} aria-label={both(t.listen)}>
          <SpeakIcon />
        </button>
      )}
      {task.done && <span className="card-check" aria-hidden="true"><CheckIcon /></span>}
      <div className="card-body">
        <span className="card-icon"><PictureView value={task.icon} size={72} /></span>
        <div className="name-fr">{task.nameFr}</div>
        {task.nameEs && <div className="name-es">{task.nameEs}</div>}
      </div>
      <div className="card-foot">
        <div className="card-avatars">
          {members.length > 0
            ? members.map((m) => <Avatar key={m.id} member={m} size={48} />)
            : <span className="avatar avatar-empty"><PersonIcon /></span>}
        </div>
        <button className="card-move" onClick={handle(onMove)} aria-label={moveLabel} title={moveLabel}>
          <span className="card-move-dot"><ArrowIcon back={task.done} /></span>
        </button>
      </div>
    </div>
  );
}

export function TaskCard(props: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.task.id });
  const className = ['card', props.task.done && 'card-done', isDragging && 'card-dragging', props.celebrate && 'card-pop']
    .filter(Boolean)
    .join(' ');
  return (
    <div ref={setNodeRef} className={className} style={postItStyle(props.task.id)} {...attributes} {...listeners}>
      <CardContent {...props} />
    </div>
  );
}
