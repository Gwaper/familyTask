import { useState, type FormEvent, type ReactNode } from 'react';
import type { Task, TaskInput } from '../../../shared/types.ts';
import { TASK_EMOJIS } from '../emojis.ts';
import { Bi } from '../Bi.tsx';
import { both, t, type Bilingual } from '../i18n.ts';
import { SpeakIcon } from '../icons.tsx';
import { PictureView } from '../Picture.tsx';
import { postItStyle } from '../ritual/postit.ts';
import { say, useCanSpeak } from '../speech.ts';
import { ChoiceGroup } from './ChoiceGroup.tsx';
import { EmojiPicker } from './EmojiPicker.tsx';
import { FormActions } from './FormActions.tsx';
import { CREW_CHOICES } from './roles.ts';

interface Props {
  task?: Task;
  onSave: (input: TaskInput) => void;
  onCancel: () => void;
}

type Lang = 'fr' | 'es';

export function TaskForm({ task, onSave, onCancel }: Props) {
  const [nameFr, setNameFr] = useState(task?.nameFr ?? '');
  const [nameEs, setNameEs] = useState(task?.nameEs ?? '');
  const [icon, setIcon] = useState(task?.icon ?? TASK_EMOJIS[0]);
  const [recurring, setRecurring] = useState(task?.recurring ?? true);
  const [crew, setCrew] = useState(task?.crew ?? 'adult');
  const canSpeak = useCanSpeak();
  const setters = { fr: setNameFr, es: setNameEs };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (nameFr.trim()) onSave({ nameFr: nameFr.trim(), nameEs: nameEs.trim(), icon, recurring, crew });
  };

  const nameField = (lang: Lang, label: Bilingual, value: string, extra?: ReactNode) => (
    <label className="field">
      <span className="field-label">{both(label)}</span>
      <span className="input-row">
        <input
          value={value}
          onChange={(e) => setters[lang](e.target.value)}
          lang={lang}
          required={lang === 'fr'}
          autoFocus={lang === 'fr'}
        />
        {extra}
      </span>
    </label>
  );

  return (
    <form className={task ? 'edit-form' : 'edit-form edit-form-new'} onSubmit={submit}>
      <div className="edit-fields">
        {!task && <h3 className="edit-title"><Bi text={t.newTask} /></h3>}
        {nameField('fr', t.nameFr, nameFr)}
        {nameField('es', t.nameEs, nameEs, canSpeak && (
          <button type="button" className="icon-button" onClick={() => say({ fr: nameFr, es: nameEs })} aria-label={both(t.listen)} title={both(t.listen)}>
            <SpeakIcon />
          </button>
        ))}
        <label className="switch-row">
          <input type="checkbox" className="switch" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          {both(t.recurring)}
        </label>
        <ChoiceGroup title={t.crew} choices={CREW_CHOICES} value={crew} onChange={setCrew} />
        <div className="field">
          <span className="field-label">{both(t.picture)}</span>
          <EmojiPicker value={icon} emojis={TASK_EMOJIS} onChange={setIcon} washed />
        </div>
        <FormActions canSave={nameFr.trim() !== ''} onCancel={onCancel} />
      </div>
      <aside className="edit-preview">
        <span className="field-label">{both(t.preview)}</span>
        <div className="preview-postit" style={postItStyle(task?.id ?? 0)}>
          <span className="emoji-blob"><PictureView value={icon} size={44} /></span>
          <strong>{nameFr || '…'}</strong>
          {nameEs && <span>{nameEs}</span>}
        </div>
      </aside>
    </form>
  );
}
