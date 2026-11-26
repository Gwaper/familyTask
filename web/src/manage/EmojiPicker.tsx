import type { Picture } from '../../../shared/types.ts';
import { PictureView } from '../Picture.tsx';

interface Props {
  value: Picture;
  emojis: string[];
  onChange: (value: Picture) => void;
  /** Emojis délavés, comme les icônes des tâches sur le tableau (les avatars, eux, gardent leurs couleurs). */
  washed?: boolean;
}

/** Grille d'emojis, affichés comme sur le tableau. */
export function EmojiPicker({ value, emojis, onChange, washed = false }: Props) {
  return (
    <div className={washed ? 'picker-grid washed' : 'picker-grid'}>
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={emoji === value ? 'picker-item selected' : 'picker-item'}
          aria-pressed={emoji === value}
          onClick={() => onChange(emoji)}
        >
          <PictureView value={emoji} size={40} />
        </button>
      ))}
    </div>
  );
}
