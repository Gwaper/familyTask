import type { MemberFields, TaskFields } from '../shared/types.ts';

type FieldKind = 'string' | 'boolean';
type Spec<T> = { [K in keyof T]: FieldKind };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Lit les champs connus d'un corps JSON. Les champs absents sont ignorés,
 * un champ du mauvais type rend le corps invalide (null). Les textes sont nettoyés (trim).
 */
function readFields<T>(body: unknown, spec: Spec<T>): Partial<T> | null {
  if (!isObject(body)) return null;
  const entries: [string, unknown][] = [];
  for (const [key, kind] of Object.entries(spec)) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== kind) return null;
    entries.push([key, typeof value === 'string' ? value.trim() : value]);
  }
  return Object.fromEntries(entries) as Partial<T>;
}

const TASK_SPEC: Spec<TaskFields> = { nameFr: 'string', nameEs: 'string', icon: 'string', recurring: 'boolean', done: 'boolean' };
const MEMBER_SPEC: Spec<MemberFields> = { name: 'string', color: 'string', avatar: 'string' };

/** Un champ obligatoire fourni doit être non vide (ex. on ne peut pas vider le nom français). */
const requiredNotEmpty = <T>(fields: Partial<T> | null, keys: (keyof T)[], creating: boolean): Partial<T> | null =>
  fields && keys.every((k) => (fields[k] === undefined ? !creating : fields[k] !== '')) ? fields : null;

export const readTask = (body: unknown, creating: boolean) =>
  requiredNotEmpty(readFields(body, TASK_SPEC), ['nameFr', 'icon'], creating);

export const readMember = (body: unknown, creating: boolean) =>
  requiredNotEmpty(readFields(body, MEMBER_SPEC), ['name', 'color', 'avatar'], creating);

/** Lit une liste d'ids entiers sous la clé donnée, ou null. */
export function readIds(body: unknown, key: string): number[] | null {
  if (!isObject(body)) return null;
  const ids = body[key];
  return Array.isArray(ids) && ids.every(Number.isInteger) ? (ids as number[]) : null;
}
