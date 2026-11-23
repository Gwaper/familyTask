import { useState, type FormEvent } from 'react';
import type { Task, TaskInput } from '../../../shared/types.ts';
import { TASK_EMOJIS } from '../emojis.ts';
import { both, t } from '../i18n.ts';
import { say, useCanSpeak } from '../speech.ts';
import { ImagePicker } from './ImagePicker.tsx';

interface Props {
  task?: Task;
  onSave: (input: TaskInput) => void;
  onCancel: () => void;
}

export function TaskForm({ task, onSave, onCancel }: Props) {
  const [nameFr, setNameFr] = useState(task?.nameFr ?? '');
  const [nameEs, setNameEs] = useState(task?.nameEs ?? '');
  const [icon, setIcon] = useState(task?.icon ?? TASK_EMOJIS[0]);
  const [recurring, setRecurring] = useState(task?.recurring ?? true);
  const canSpeak = useCanSpeak();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (nameFr.trim()) onSave({ nameFr: nameFr.trim(), nameEs: nameEs.trim(), icon, recurring });
  };

  return (
    <form className="edit-form" onSubmit={submit}>
      <label>
        {both(t.nameFr)}
        <input value={nameFr} onChange={(e) => setNameFr(e.target.value)} required autoFocus />
      </label>
      <label>
        {both(t.nameEs)}
        <span className="input-row">
          <input value={nameEs} onChange={(e) => setNameEs(e.target.value)} lang="es" />
          {canSpeak && (
            <button type="button" className="round-button" onClick={() => say({ fr: nameFr, es: nameEs })} title={both(t.listen)}>
              🔊
            </button>
          )}
        </span>
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        🔁 {both(t.recurring)}
      </label>
      <div>
        {both(t.picture)}
        <ImagePicker value={icon} emojis={TASK_EMOJIS} onChange={setIcon} />
      </div>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>{both(t.cancel)}</button>
        <button type="submit" className="primary" disabled={!nameFr.trim()}>{both(t.save)}</button>
      </div>
    </form>
  );
}
