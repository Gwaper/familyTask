import { beforeEach, describe, expect, it } from 'vitest';
import { createMember, createTask, deleteRow, getBoard, openDb, reorder, setTaskMembers, updateTask, type Db } from './db.ts';

let db: Db;
const task = (id: number) => getBoard(db).tasks.find((t) => t.id === id);

beforeEach(() => {
  db = openDb(':memory:');
});

describe('seed', () => {
  it('crée 2 parents et 2 tâches récurrentes sans attribution', () => {
    const { members, tasks } = getBoard(db);
    expect(members.map((m) => m.name)).toEqual(['Papa', 'Maman']);
    expect(tasks.map((t) => [t.nameFr, t.nameEs, t.recurring, t.done, t.memberIds])).toEqual([
      ['Ranger les jouets', 'Recoger los juguetes', true, false, []],
      ['Ranger les livres', 'Recoger los libros', true, false, []],
    ]);
  });
});

describe('tâches', () => {
  it('change le statut à faire ↔ fini', () => {
    const id = createTask(db, { nameFr: 'Mettre la table', icon: '🍽️' });
    expect(updateTask(db, id, { done: true })).toBe(true);
    expect(task(id)?.done).toBe(true);
    updateTask(db, id, { done: false });
    expect(task(id)?.done).toBe(false);
  });

  it('accepte une tâche sans nom espagnol', () => {
    const id = createTask(db, { nameFr: 'Arroser les plantes', icon: '🌱' });
    expect(task(id)).toMatchObject({ nameFr: 'Arroser les plantes', nameEs: '', recurring: false });
  });

  it('renvoie false pour une tâche inconnue', () => {
    expect(updateTask(db, 999, { done: true })).toBe(false);
    expect(setTaskMembers(db, 999, [1])).toBe(false);
  });

  it('réordonne', () => {
    const [a, b] = getBoard(db).tasks.map((t) => t.id);
    reorder(db, 'tasks', [b, a]);
    expect(getBoard(db).tasks.map((t) => t.id)).toEqual([b, a]);
  });
});

describe('attributions', () => {
  it('attribue plusieurs personnes à une même tâche, dans l’ordre des membres', () => {
    const [papa, maman] = getBoard(db).members.map((m) => m.id);
    const [jouets] = getBoard(db).tasks.map((t) => t.id);
    setTaskMembers(db, jouets, [maman, papa]);
    expect(task(jouets)?.memberIds).toEqual([papa, maman]);
  });

  it('ignore les membres inconnus et les doublons', () => {
    const [papa] = getBoard(db).members.map((m) => m.id);
    const [jouets] = getBoard(db).tasks.map((t) => t.id);
    setTaskMembers(db, jouets, [papa, papa, 999]);
    expect(task(jouets)?.memberIds).toEqual([papa]);
  });

  it('retire un membre supprimé de ses attributions', () => {
    const lea = createMember(db, { name: 'Léa', color: '#22c55e', avatar: '👧' });
    const [papa] = getBoard(db).members.map((m) => m.id);
    const [jouets, livres] = getBoard(db).tasks.map((t) => t.id);
    setTaskMembers(db, jouets, [papa, lea]);
    setTaskMembers(db, livres, [lea]);
    expect(deleteRow(db, 'members', lea)).toBe(true);
    expect(getBoard(db).members.some((m) => m.id === lea)).toBe(false);
    expect(task(jouets)?.memberIds).toEqual([papa]);
    expect(task(livres)?.memberIds).toEqual([]);
  });

  it('supprime les attributions d’une tâche supprimée', () => {
    const [papa] = getBoard(db).members.map((m) => m.id);
    const [jouets] = getBoard(db).tasks.map((t) => t.id);
    setTaskMembers(db, jouets, [papa]);
    deleteRow(db, 'tasks', jouets);
    expect(db.prepare('SELECT COUNT(*) AS n FROM task_members').get()?.n).toBe(0);
  });
});
