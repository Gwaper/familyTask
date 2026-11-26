import { mkdtempSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyDraw, createMember, createTask, deleteRow, getBoard, openDb, reorder, setTaskMembers, updateMember, updateTask, type Db,
} from './db.ts';

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

  it('applique un tirage au sort en remplaçant les attributions', () => {
    const [papa, maman] = getBoard(db).members.map((m) => m.id);
    const [jouets, livres] = getBoard(db).tasks.map((t) => t.id);
    setTaskMembers(db, jouets, [papa]);
    applyDraw(db, new Map([[jouets, [maman]], [livres, [papa]]]));
    expect(getBoard(db).tasks.map((t) => t.memberIds)).toEqual([[maman], [papa]]);
  });
});

describe('adulte / enfant', () => {
  it('membre adulte et tâche « adulte » par défaut, modifiables', () => {
    const lea = createMember(db, { name: 'Léa', color: '#22c55e', avatar: '👧', role: 'child' });
    const id = createTask(db, { nameFr: 'Mettre la table', icon: '🍽️' });
    expect(getBoard(db).members.map((m) => m.role)).toEqual(['adult', 'adult', 'child']);
    expect(task(id)?.crew).toBe('adult');
    updateTask(db, id, { crew: 'child_adult' });
    updateMember(db, lea, { role: 'adult' });
    expect(task(id)?.crew).toBe('child_adult');
    expect(getBoard(db).members.find((m) => m.id === lea)?.role).toBe('adult');
  });

  it('ajoute les colonnes à une base existante', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'kanban-')), 'old.db');
    const old = new DatabaseSync(file);
    old.exec(`
      CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, avatar TEXT NOT NULL, position INTEGER NOT NULL);
      CREATE TABLE tasks (id INTEGER PRIMARY KEY, name_fr TEXT NOT NULL, name_es TEXT NOT NULL DEFAULT '', icon TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0, recurring INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL);
      INSERT INTO members (name, color, avatar, position) VALUES ('Papa', '#000', '👨', 0);
      INSERT INTO tasks (name_fr, icon, position) VALUES ('Ranger', '🧸', 0);
    `);
    old.close();
    const migrated = openDb(file);
    const { members, tasks } = getBoard(migrated);
    expect([members[0].role, tasks[0].crew]).toEqual(['adult', 'adult']);
    migrated.close();
  });
});
