import type { Board } from '../../../shared/types.ts';
import { api } from '../api.ts';
import { Bi } from '../Bi.tsx';
import { ArrowIcon, RefreshIcon } from '../icons.tsx';
import { both, t } from '../i18n.ts';
import { Avatar, PictureView } from '../Picture.tsx';
import { postItStyle } from '../ritual/postit.ts';
import type { Mutate } from '../useBoard.ts';
import { ManagedList } from './ManagedList.tsx';
import { MemberForm } from './MemberForm.tsx';
import { CREW_CHOICES, ROLE_CHOICES, type Choice } from './roles.ts';
import { TaskForm } from './TaskForm.tsx';

/** Pastille colorée selon la catégorie (adulte, enfant, enfant + adulte). */
const Pill = ({ kind, choice }: { kind: string; choice: Choice }) => (
  <span className={`pill pill-${kind}`} title={both(choice.label)}>{choice.emoji} {choice.label.fr}</span>
);

export function Manage({ board, mutate }: { board: Board; mutate: Mutate }) {
  /** Lance l'appel puis referme le formulaire ; le tableau est rafraîchi par `mutate`. */
  const run = (call: () => Promise<unknown>, close?: () => void) => {
    close?.();
    void mutate(call);
  };

  const resetDay = () => {
    if (confirm(both(t.confirmReset))) run(api.reset);
  };

  return (
    <main className="manage">
      <header className="manage-header">
        <a className="back-link" href="/">
          <span className="back-dot"><ArrowIcon back /></span>
          <Bi text={t.back} />
        </a>
        <h1 className="manage-heading">
          <span aria-hidden="true">🛠️</span>
          <span className="manage-heading-fr">{t.manage.fr}</span>
          <span className="manage-heading-es">· {t.manage.es}</span>
        </h1>
      </header>

      <div className="sheet">
        <ManagedList
          tone="tasks"
          title={t.tasks}
          addLabel={t.addTask}
          confirmDelete={t.confirmDeleteTask}
          items={board.tasks}
          renderItem={(task) => (
            <>
              <span className="mini-postit" style={postItStyle(task.id)}>
                <span className="emoji-blob"><PictureView value={task.icon} size={34} /></span>
              </span>
              <span className="manage-names">
                <strong>{task.nameFr}</strong>
                {task.nameEs && <span>{task.nameEs}</span>}
              </span>
              <span className="pills">
                <Pill kind={task.crew} choice={CREW_CHOICES[task.crew]} />
                {task.recurring && (
                  <span className="pill pill-recurring" title={both(t.recurring)}><RefreshIcon size={16} /> {t.recurring.fr}</span>
                )}
              </span>
            </>
          )}
          renderForm={(task, close) => (
            <TaskForm
              task={task}
              onCancel={close}
              onSave={(input) => run(() => (task ? api.updateTask(task.id, input) : api.createTask(input)), close)}
            />
          )}
          onDelete={(id) => run(() => api.remove('tasks', id))}
        />

        <ManagedList
          tone="members"
          title={t.members}
          addLabel={t.addMember}
          confirmDelete={t.confirmDeleteMember}
          items={board.members}
          renderItem={(member) => (
            <>
              <Avatar member={member} size={56} />
              <strong className="manage-names">{member.name}</strong>
              <span className="pills"><Pill kind={member.role} choice={ROLE_CHOICES[member.role]} /></span>
            </>
          )}
          renderForm={(member, close) => (
            <MemberForm
              member={member}
              onCancel={close}
              onSave={(input) => run(() => (member ? api.updateMember(member.id, input) : api.createMember(input)), close)}
            />
          )}
          onDelete={(id) => run(() => api.remove('members', id))}
        />

        <footer className="sheet-footer">
          <button className="pill-button pill-quiet" onClick={resetDay}>
            <span className="pill-button-dot"><RefreshIcon /></span>
            <Bi text={t.resetDay} />
          </button>
        </footer>
      </div>
    </main>
  );
}
