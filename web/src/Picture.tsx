import type { Member, Picture } from '../../shared/types.ts';
import { PHOTO_PREFIX } from '../../shared/types.ts';

export const photoUrl = (file: string) => `/photos/${encodeURIComponent(file)}`;

/** Affiche un emoji ou une photo de /data/kanban/photos, dans un carré de `size` px. */
export function PictureView({ value, size }: { value: Picture; size: number }) {
  const style = { width: size, height: size };
  return value.startsWith(PHOTO_PREFIX) ? (
    <img className="picture" style={style} src={photoUrl(value.slice(PHOTO_PREFIX.length))} alt="" draggable={false} />
  ) : (
    <span className="picture" style={{ ...style, fontSize: size * 0.78 }} aria-hidden="true">{value}</span>
  );
}

/** Avatar rond sur la couleur du membre. */
export function Avatar({ member, size }: { member: Member; size: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: member.color }} title={member.name}>
      <PictureView value={member.avatar} size={member.avatar.startsWith(PHOTO_PREFIX) ? size : size * 0.75} />
    </span>
  );
}
