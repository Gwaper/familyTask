/** Emoji, ou `photo:<fichier>` pour une photo de /data/kanban/photos. */
export type Picture = string;

export interface Member {
  id: number;
  name: string;
  color: string;
  avatar: Picture;
  position: number;
}

export interface Task {
  id: number;
  nameFr: string;
  /** Chaîne vide si pas de traduction : on n'affiche et ne lit alors que le français. */
  nameEs: string;
  icon: Picture;
  done: boolean;
  recurring: boolean;
  position: number;
  memberIds: number[];
}

export interface Board {
  members: Member[];
  tasks: Task[];
}

export type MemberFields = Pick<Member, 'name' | 'color' | 'avatar'>;
export type TaskFields = Pick<Task, 'nameFr' | 'nameEs' | 'icon' | 'recurring' | 'done'>;
export type TaskInput = Pick<Task, 'nameFr' | 'icon'> & Partial<TaskFields>;

export const PHOTO_PREFIX = 'photo:';
