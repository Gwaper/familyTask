import { beforeEach, describe, expect, it } from 'vitest';
import { createTask, getBoard, getMeta, openDb, setMeta, setTaskMembers, updateTask, type Db } from './db.ts';
import { applyDueReset, dueResetDate, isValidTime } from './reset.ts';

const config = { time: '03:00', timeZone: 'Europe/Paris' };
// En novembre, Paris = UTC+1 : 02:00Z = 03:00 à Paris.
const at = (iso: string) => new Date(iso);

describe('dueResetDate', () => {
  it('renvoie la veille avant l’heure de remise à zéro, le jour même après', () => {
    expect(dueResetDate(at('2026-11-23T01:59:00Z'), config)).toBe('2026-11-22');
    expect(dueResetDate(at('2026-11-23T02:00:00Z'), config)).toBe('2026-11-23');
    expect(dueResetDate(at('2026-11-23T22:30:00Z'), config)).toBe('2026-11-23');
  });

  it('gère le changement de mois et d’année', () => {
    expect(dueResetDate(at('2027-01-01T00:30:00Z'), config)).toBe('2026-12-31');
  });

  it('gère le passage à l’heure d’été', () => {
    // 29 mars 2026 : 02:00 → 03:00 à Paris (01:00Z).
    expect(dueResetDate(at('2026-03-29T00:59:00Z'), config)).toBe('2026-03-28');
    expect(dueResetDate(at('2026-03-29T01:00:00Z'), config)).toBe('2026-03-29');
  });
});

describe('applyDueReset', () => {
  let db: Db;
  let recurring: number;
  let oneOff: number;
  let papa: number;
  let maman: number;
  const task = (id: number) => getBoard(db).tasks.find((t) => t.id === id);

  beforeEach(() => {
    db = openDb(':memory:');
    [papa, maman] = getBoard(db).members.map((m) => m.id);
    recurring = getBoard(db).tasks[0].id;
    oneOff = createTask(db, { nameFr: 'Ranger le garage', icon: '🧰', recurring: false });
    setMeta(db, 'last_reset', '2026-11-22');
    updateTask(db, recurring, { done: true });
    updateTask(db, oneOff, { done: true });
    setTaskMembers(db, recurring, [papa, maman]);
  });

  it('remet les tâches récurrentes à « À faire » en conservant les attributions', () => {
    expect(applyDueReset(db, at('2026-11-23T02:01:00Z'), config)).toBe(true);
    expect(task(recurring)).toMatchObject({ done: false, memberIds: [papa, maman] });
    expect(getMeta(db, 'last_reset')).toBe('2026-11-23');
  });

  it('ne touche pas aux tâches ponctuelles finies', () => {
    applyDueReset(db, at('2026-11-23T02:01:00Z'), config);
    expect(task(oneOff)?.done).toBe(true);
  });

  it('ne fait rien avant l’heure, ni deux fois le même jour', () => {
    expect(applyDueReset(db, at('2026-11-23T01:30:00Z'), config)).toBe(false);
    expect(task(recurring)?.done).toBe(true);
    applyDueReset(db, at('2026-11-23T02:01:00Z'), config);
    updateTask(db, recurring, { done: true }); // refaite dans la journée
    expect(applyDueReset(db, at('2026-11-23T20:00:00Z'), config)).toBe(false);
    expect(task(recurring)?.done).toBe(true);
  });

  it('rattrape une remise à zéro manquée après un redémarrage (même après plusieurs jours)', () => {
    // Serveur éteint de 2 h à 5 h 30 : au redémarrage, la remise à zéro du jour est rattrapée.
    expect(applyDueReset(db, at('2026-11-23T04:30:00Z'), config)).toBe(true);
    expect(task(recurring)).toMatchObject({ done: false, memberIds: [papa, maman] });
    setMeta(db, 'last_reset', '2026-11-19');
    updateTask(db, recurring, { done: true });
    expect(applyDueReset(db, at('2026-11-23T10:00:00Z'), config)).toBe(true);
    expect(task(recurring)?.done).toBe(false);
  });

  it('un redémarrage après la remise à zéro du jour ne refait rien', () => {
    applyDueReset(db, at('2026-11-23T02:00:30Z'), config);
    updateTask(db, recurring, { done: true });
    expect(applyDueReset(db, at('2026-11-23T03:30:00Z'), config)).toBe(false); // redémarrage à 4 h 30
    expect(task(recurring)?.done).toBe(true);
  });
});

describe('isValidTime', () => {
  it('valide le format HH:MM', () => {
    expect(['03:00', '00:00', '23:59'].every(isValidTime)).toBe(true);
    expect(['3:00', '24:00', '03:60', 'abc'].some(isValidTime)).toBe(false);
  });
});
