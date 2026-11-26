import { useEffect, useState, type ChangeEvent } from 'react';
import { PHOTO_PREFIX, type Picture } from '../../../shared/types.ts';
import { api } from '../api.ts';
import { both, t } from '../i18n.ts';
import { PictureView } from '../Picture.tsx';

interface Props {
  value: Picture;
  emojis: string[];
  onChange: (value: Picture) => void;
}

/** Choix d'un emoji ou d'une photo (déjà envoyée, ou envoyée depuis l'appareil). */
export function ImagePicker({ value, emojis, onChange }: Props) {
  const [tab, setTab] = useState<'emojis' | 'photos'>(value.startsWith(PHOTO_PREFIX) ? 'photos' : 'emojis');
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  useEffect(() => {
    if (tab === 'photos' && photos === null) api.photos().then(setPhotos, () => setPhotos([]));
  }, [tab, photos]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // permet de renvoyer le même fichier
    if (!file) return;
    try {
      const { file: name } = await api.uploadPhoto(file);
      setUploadFailed(false);
      setPhotos(null); // recharge la liste
      onChange(PHOTO_PREFIX + name);
    } catch {
      setUploadFailed(true);
    }
  };

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
      {tab === 'photos' && (
        <label className="secondary upload-button">
          📷 {both(t.addPhoto)}
          <input type="file" accept="image/*" hidden onChange={upload} />
        </label>
      )}
      {tab === 'photos' && uploadFailed && <p className="hint">{both(t.uploadFailed)}</p>}
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
