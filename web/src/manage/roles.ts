import type { MemberRole, TaskCrew } from '../../../shared/types.ts';
import { t, type Bilingual } from '../i18n.ts';

export interface Choice {
  emoji: string;
  label: Bilingual;
}

export const ROLE_CHOICES: Record<MemberRole, Choice> = {
  adult: { emoji: '🧑', label: t.adult },
  child: { emoji: '🧒', label: t.child },
};

export const CREW_CHOICES: Record<TaskCrew, Choice> = {
  adult: { emoji: '🧑', label: t.crewAdult },
  child_adult: { emoji: '🧒🧑', label: t.crewChildAdult },
  child: { emoji: '🧒', label: t.crewChild },
};
