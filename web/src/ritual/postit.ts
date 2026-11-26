import type { CSSProperties } from 'react';

/** Papiers pastel des post-it. */
export const PAPERS = ['#fff3a8', '#ffd9e6', '#d4e8ff', '#d8f2e1', '#ffe6c7', '#e6dcff'] as const;
/** Inclinaisons du post-it et de son scotch, en degrés. */
const TILTS = [-2.6, 2.2, 1.6, -2, 2.4, -1.4, 1.1] as const;
const TAPES = [-4, 3, -2, 4, -3] as const;

export interface PostIt {
  paper: string;
  tilt: number;
  tape: number;
}

/** Aspect d'un post-it, toujours le même pour une tâche donnée (rien n'est stocké en base). */
export function postIt(taskId: number): PostIt {
  const pick = <T>(list: readonly T[], step: number) => list[Math.abs(taskId * step) % list.length];
  return { paper: pick(PAPERS, 1), tilt: pick(TILTS, 3), tape: pick(TAPES, 7) };
}

/** Couleur et inclinaison du post-it, passées au CSS par des variables. */
export function postItStyle(taskId: number): CSSProperties {
  const { paper, tilt, tape } = postIt(taskId);
  return { '--paper': paper, '--tilt': `${tilt}deg`, '--tape': `${tape}deg` } as CSSProperties;
}
