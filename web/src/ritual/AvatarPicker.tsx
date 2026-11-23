import type { Member, Task } from '../../../shared/types.ts';
import { both, t } from '../i18n.ts';
import { Avatar, PictureView } from '../Picture.tsx';
import { say, useCanSpeak } from '../speech.ts';

interface Props {
  task: Task;
  members: Member[];
  /** Pose la question « Qui l'a fait ? » (carte arrivée dans « Fini ! » sans personne). */
  ask: boolean;
  onToggle: (memberId: number) => void;
  onClose: () => void;
}

/** Bulle de gros avatars : un tap ajoute ou retire la personne. */
export function AvatarPicker({ task, members, ask, onToggle, onClose }: Props) {
  const canSpeak = useCanSpeak();
  return (
    <div className="overlay" onClick={onClose}>
      <div className="bubble" onClick={(e) => e.stopPropagation()}>
        <div className="bubble-head">
          <PictureView value={task.icon} size={80} />
          {ask && <h2>{both(t.whoDidIt)}</h2>}
          {ask && canSpeak && (
            <button className="round-button" onClick={() => say(t.whoDidIt)} aria-label="🔊">🔊</button>
          )}
        </div>
        <div className="avatar-grid">
          {members.map((member) => {
            const selected = task.memberIds.includes(member.id);
            return (
              <button
                key={member.id}
                className={`avatar-choice${selected ? ' selected' : ''}`}
                style={{ borderColor: selected ? member.color : 'transparent' }}
                onClick={() => onToggle(member.id)}
                aria-pressed={selected}
              >
                <Avatar member={member} size={110} />
                {selected && <span className="check" style={{ background: member.color }}>✓</span>}
                <span className="avatar-name">{member.name}</span>
              </button>
            );
          })}
        </div>
        <button className="ok-button" onClick={onClose} aria-label={t.ok.fr}>👍</button>
      </div>
    </div>
  );
}
