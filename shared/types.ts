/** Emoji, ou `photo:<fichier>` pour une photo de /data/kanban/photos. */
export type Picture = string;

export const MEMBER_ROLES = ['adult', 'child'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** Qui fait la tâche : un adulte, un enfant accompagné d'un adulte, ou un enfant seul. */
export const TASK_CREWS = ['adult', 'child_adult', 'child'] as const;
export type TaskCrew = (typeof TASK_CREWS)[number];

/** Rôles à tirer au sort pour chaque type de tâche (une personne par rôle). */
export const CREW_ROLES: Record<TaskCrew, MemberRole[]> = {
  adult: ['adult'],
  child_adult: ['child', 'adult'],
  child: ['child'],
};

export interface Member {
  id: number;
  name: string;
  color: string;
  avatar: Picture;
  role: MemberRole;
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
  crew: TaskCrew;
  position: number;
  memberIds: number[];
}

export interface Board {
  members: Member[];
  tasks: Task[];
}

export type MemberFields = Pick<Member, 'name' | 'color' | 'avatar' | 'role'>;
export type MemberInput = Pick<Member, 'name' | 'color' | 'avatar'> & Partial<MemberFields>;
export type TaskFields = Pick<Task, 'nameFr' | 'nameEs' | 'icon' | 'recurring' | 'done' | 'crew'>;
export type TaskInput = Pick<Task, 'nameFr' | 'icon'> & Partial<TaskFields>;

export const PHOTO_PREFIX = 'photo:';
