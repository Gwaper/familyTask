import { CREW_ROLES, type Board } from './types.ts';

/**
 * Tirage au sort équilibré des tâches « À faire » : pour chaque rôle demandé par la tâche,
 * on choisit au hasard parmi les membres de ce rôle qui ont le moins de tâches tirées jusque-là.
 * Un rôle sans aucun membre reste vide. Renvoie id de tâche → ids des membres tirés.
 */
export function drawAssignments(board: Board, random: () => number = Math.random): Map<number, number[]> {
  const load = new Map(board.members.map((m) => [m.id, 0]));
  const count = (id: number): number => load.get(id) ?? 0;
  const assignments = new Map<number, number[]>();

  for (const task of board.tasks.filter((t) => !t.done)) {
    const memberIds: number[] = [];
    for (const role of CREW_ROLES[task.crew]) {
      const candidates = board.members.filter((m) => m.role === role);
      if (candidates.length === 0) continue;
      const min = Math.min(...candidates.map((m) => count(m.id)));
      const least = candidates.filter((m) => count(m.id) === min);
      const chosen = least[Math.floor(random() * least.length)];
      load.set(chosen.id, min + 1);
      memberIds.push(chosen.id);
    }
    assignments.set(task.id, memberIds);
  }
  return assignments;
}
