import type { Board, Member, Task } from '../../shared/types.ts';

/** Fonctions pures de mise à jour du tableau, utilisées pour les mises à jour optimistes. */

export const patchTask = (board: Board, id: number, patch: Partial<Task>): Board => ({
  ...board,
  tasks: board.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
});

export const toggleId = (ids: number[], id: number): number[] =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

export const allDone = (tasks: Task[]): boolean => tasks.length > 0 && tasks.every((task) => task.done);

/** Membres attribués à une tâche, dans l'ordre d'affichage des membres. */
export const assignedMembers = (board: Board, task: Task): Member[] =>
  board.members.filter((member) => task.memberIds.includes(member.id));

/** Déplace un élément de `delta` places ; renvoie la liste inchangée si on sort des bornes. */
export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
