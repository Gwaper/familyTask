import { useState, type FormEvent } from 'react';
import type { Member, MemberFields } from '../../../shared/types.ts';
import { MEMBER_COLORS, MEMBER_EMOJIS } from '../emojis.ts';
import { both, t } from '../i18n.ts';
import { Avatar } from '../Picture.tsx';
import { ImagePicker } from './ImagePicker.tsx';

interface Props {
  member?: Member;
  onSave: (input: MemberFields) => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSave, onCancel }: Props) {
  const [name, setName] = useState(member?.name ?? '');
  const [color, setColor] = useState(member?.color ?? MEMBER_COLORS[0]);
  const [avatar, setAvatar] = useState(member?.avatar ?? MEMBER_EMOJIS[6]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) onSave({ name: name.trim(), color, avatar });
  };

  return (
    <form className="edit-form" onSubmit={submit}>
      <div className="preview">
        <Avatar member={{ id: 0, position: 0, name, color, avatar }} size={88} />
      </div>
      <label>
        {both(t.firstName)}
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <div>
        {both(t.color)}
        <div className="swatches">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={c === color ? 'swatch selected' : 'swatch'}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <div>
        {both(t.picture)}
        <ImagePicker value={avatar} emojis={MEMBER_EMOJIS} onChange={setAvatar} />
      </div>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>{both(t.cancel)}</button>
        <button type="submit" className="primary" disabled={!name.trim()}>{both(t.save)}</button>
      </div>
    </form>
  );
}
