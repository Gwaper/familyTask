import { useState, type FormEvent } from 'react';
import type { Member, MemberFields } from '../../../shared/types.ts';
import { MEMBER_COLORS, MEMBER_EMOJIS } from '../emojis.ts';
import { Bi } from '../Bi.tsx';
import { both, t } from '../i18n.ts';
import { Avatar, softColor } from '../Picture.tsx';
import { ChoiceGroup } from './ChoiceGroup.tsx';
import { EmojiPicker } from './EmojiPicker.tsx';
import { FormActions } from './FormActions.tsx';
import { ROLE_CHOICES } from './roles.ts';

interface Props {
  member?: Member;
  onSave: (input: MemberFields) => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSave, onCancel }: Props) {
  const [name, setName] = useState(member?.name ?? '');
  const [color, setColor] = useState(member?.color ?? MEMBER_COLORS[0]);
  const [avatar, setAvatar] = useState(member?.avatar ?? '👦');
  const [role, setRole] = useState(member?.role ?? 'adult');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) onSave({ name: name.trim(), color, avatar, role });
  };

  return (
    <form className={member ? 'edit-form' : 'edit-form edit-form-new'} onSubmit={submit}>
      <div className="edit-fields">
        {!member && <h3 className="edit-title"><Bi text={t.newMember} /></h3>}
        <label className="field">
          <span className="field-label">{both(t.firstName)}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <ChoiceGroup title={t.role} choices={ROLE_CHOICES} value={role} onChange={setRole} />
        <div className="field">
          <span className="field-label">{both(t.color)}</span>
          <div className="swatches">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={c === color ? 'swatch selected' : 'swatch'}
                style={{ background: softColor(c) }}
                aria-pressed={c === color}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field-label">{both(t.picture)}</span>
          <EmojiPicker value={avatar} emojis={MEMBER_EMOJIS} onChange={setAvatar} />
        </div>
        <FormActions canSave={name.trim() !== ''} onCancel={onCancel} />
      </div>
      <aside className="edit-preview">
        <span className="field-label">{both(t.preview)}</span>
        <Avatar member={{ id: 0, position: 0, name, color, avatar, role }} size={110} />
        <strong>{name || '…'}</strong>
      </aside>
    </form>
  );
}
