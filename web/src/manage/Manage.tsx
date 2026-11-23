import type { Board } from '../../../shared/types.ts';
import { api } from '../api.ts';
import { both, t } from '../i18n.ts';
import { Avatar, PictureView } from '../Picture.tsx';
import type { Mutate } from '../useBoard.ts';
import { ManagedList } from './ManagedList.tsx';
import { MemberForm } from './MemberForm.tsx';
import { TaskForm } from './TaskForm.tsx';

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
        <a className="secondary back-link" href="#">⬅️ {both(t.back)}</a>
      </header>

      <ManagedList
        title={t.tasks}
        addLabel={t.addTask}
        confirmDelete={t.confirmDeleteTask}
        items={board.tasks}
        renderItem={(task) => (
          <>
            <PictureView value={task.icon} size={44} />
            <span className="manage-names">
              <strong>{task.nameFr}</strong>
              {task.nameEs && <span>{task.nameEs}</span>}
            </span>
            {task.recurring && <span title={both(t.recurring)}>🔁</span>}
          </>
        )}
        renderForm={(task, close) => (
          <TaskForm
            task={task}
            onCancel={close}
            onSave={(input) => run(() => (task ? api.updateTask(task.id, input) : api.createTask(input)), close)}
          />
        )}
        onReorder={(ids) => run(() => api.reorder('tasks', ids))}
        onDelete={(id) => run(() => api.remove('tasks', id))}
      />

      <ManagedList
        title={t.members}
        addLabel={t.addMember}
        confirmDelete={t.confirmDeleteMember}
        items={board.members}
        renderItem={(member) => (
          <>
            <Avatar member={member} size={44} />
            <strong className="manage-names">{member.name}</strong>
          </>
        )}
        renderForm={(member, close) => (
          <MemberForm
            member={member}
            onCancel={close}
            onSave={(input) => run(() => (member ? api.updateMember(member.id, input) : api.createMember(input)), close)}
          />
        )}
        onReorder={(ids) => run(() => api.reorder('members', ids))}
        onDelete={(id) => run(() => api.remove('members', id))}
      />

      <section className="manage-section">
        <button className="secondary" onClick={resetDay}>🔄 {both(t.resetDay)}</button>
      </section>
    </main>
  );
}
