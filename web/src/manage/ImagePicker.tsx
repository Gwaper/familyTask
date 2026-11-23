import { useEffect, useState } from 'react';
import { PHOTO_PREFIX, type Picture } from '../../../shared/types.ts';
import { api } from '../api.ts';
import { both, t } from '../i18n.ts';
import { PictureView } from '../Picture.tsx';

interface Props {
  value: Picture;
  emojis: string[];
  onChange: (value: Picture) => void;
}

/** Choix d'un emoji ou d'une photo de /data/kanban/photos. */
export function ImagePicker({ value, emojis, onChange }: Props) {
  const [tab, setTab] = useState<'emojis' | 'photos'>(value.startsWith(PHOTO_PREFIX) ? 'photos' : 'emojis');
  const [photos, setPhotos] = useState<string[] | null>(null);

  useEffect(() => {
    if (tab === 'photos' && photos === null) api.photos().then(setPhotos, () => setPhotos([]));
  }, [tab, photos]);

  const options = tab === 'emojis' ? emojis : (photos ?? []).map((file) => PHOTO_PREFIX + file);

  return (
    <div className="image-picker">
      <div className="tabs">
        {(['emojis', 'photos'] as const).map((name) => (
          <button key={name} type="button" className={tab === name ? 'tab active' : 'tab'} onClick={() => setTab(name)}>
            {both(t[name])}
          </button>
        ))}
      </div>
      {tab === 'photos' && photos?.length === 0 && <p className="hint">{both(t.noPhotos)}</p>}
      <div className="picker-grid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={option === value ? 'picker-item selected' : 'picker-item'}
            onClick={() => onChange(option)}
          >
            <PictureView value={option} size={44} />
          </button>
        ))}
      </div>
    </div>
  );
}
