import { DatabaseSync, type SQLOutputValue } from 'node:sqlite';
import type { Board, Member, MemberInput, MemberFields, MemberRole, Task, TaskCrew, TaskFields, TaskInput } from '../shared/types.ts';

export type Db = DatabaseSync;
type Row = Record<string, SQLOutputValue>;
export type OrderedTable = 'tasks' | 'members';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  avatar TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'adult',
  position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_es TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  recurring INTEGER NOT NULL DEFAULT 0,
  crew TEXT NOT NULL DEFAULT 'adult',
  position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS task_members (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, member_id)
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export function openDb(file: string): Db {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  addColumnIfMissing(db, 'members', 'role', "TEXT NOT NULL DEFAULT 'adult'");
  addColumnIfMissing(db, 'tasks', 'crew', "TEXT NOT NULL DEFAULT 'adult'");
  if (!getMeta(db, 'seeded')) seed(db);
  return db;
}

/** Migration des bases créées avant l'ajout d'une colonne (CREATE TABLE IF NOT EXISTS ne les modifie pas). */
function addColumnIfMissing(db: Db, table: OrderedTable, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

/** Seed initial, joué une seule fois : on ne recrée rien si la famille vide ensuite le tableau. */
function seed(db: Db): void {
  transaction(db, () => {
    createMember(db, { name: 'Papa', color: '#4f7cff', avatar: '👨' });
    createMember(db, { name: 'Maman', color: '#ff8a3d', avatar: '👩' });
    createTask(db, { nameFr: 'Ranger les jouets', nameEs: 'Recoger los juguetes', icon: '🧸', recurring: true });
    createTask(db, { nameFr: 'Ranger les livres', nameEs: 'Recoger los libros', icon: '📚', recurring: true });
    setMeta(db, 'seeded', '1');
  });
}

export function transaction<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// ---------- meta ----------

export function getMeta(db: Db, key: string): string | undefined {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? String(row.value) : undefined;
}

export function setMeta(db: Db, key: string, value: string): void {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
}

// ---------- lecture ----------

const toMember = (r: Row): Member => ({
  id: Number(r.id),
  name: String(r.name),
  color: String(r.color),
  avatar: String(r.avatar),
  role: String(r.role) as MemberRole,
  position: Number(r.position),
});

const toTask = (r: Row, memberIds: number[]): Task => ({
  id: Number(r.id),
  nameFr: String(r.name_fr),
  nameEs: String(r.name_es),
  icon: String(r.icon),
  done: r.done === 1,
  recurring: r.recurring === 1,
  crew: String(r.crew) as TaskCrew,
  position: Number(r.position),
  memberIds,
});

export function getBoard(db: Db): Board {
  const members = db.prepare('SELECT * FROM members ORDER BY position, id').all().map(toMember);
  const links = db.prepare(
    `SELECT tm.task_id, tm.member_id FROM task_members tm
     JOIN members m ON m.id = tm.member_id ORDER BY m.position, m.id`,
  ).all();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY position, id').all().map((r) =>
    toTask(r, links.filter((l) => l.task_id === r.id).map((l) => Number(l.member_id))),
  );
  return { members, tasks };
}

// ---------- écriture ----------

function nextPosition(db: Db, table: OrderedTable): number {
  const row = db.prepare(`SELECT COALESCE(MAX(position) + 1, 0) AS next FROM ${table}`).get();
  return Number(row?.next ?? 0);
}

const flag = (value: boolean | undefined): number => (value ? 1 : 0);

export function createTask(db: Db, input: TaskInput): number {
  const result = db.prepare(
    'INSERT INTO tasks (name_fr, name_es, icon, done, recurring, crew, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    input.nameFr, input.nameEs ?? '', input.icon, flag(input.done), flag(input.recurring), input.crew ?? 'adult',
    nextPosition(db, 'tasks'),
  );
  return Number(result.lastInsertRowid);
}

/** Met à jour les champs fournis. Renvoie false si la tâche n'existe pas. */
export function updateTask(db: Db, id: number, patch: Partial<TaskFields>): boolean {
  const current = getBoard(db).tasks.find((t) => t.id === id);
  if (!current) return false;
  const next = { ...current, ...patch };
  db.prepare('UPDATE tasks SET name_fr = ?, name_es = ?, icon = ?, done = ?, recurring = ?, crew = ? WHERE id = ?')
    .run(next.nameFr, next.nameEs, next.icon, flag(next.done), flag(next.recurring), next.crew, id);
  return true;
}

export function createMember(db: Db, input: MemberInput): number {
  const result = db.prepare('INSERT INTO members (name, color, avatar, role, position) VALUES (?, ?, ?, ?, ?)')
    .run(input.name, input.color, input.avatar, input.role ?? 'adult', nextPosition(db, 'members'));
  return Number(result.lastInsertRowid);
}

export function updateMember(db: Db, id: number, patch: Partial<MemberFields>): boolean {
  const current = getBoard(db).members.find((m) => m.id === id);
  if (!current) return false;
  const next = { ...current, ...patch };
  db.prepare('UPDATE members SET name = ?, color = ?, avatar = ?, role = ? WHERE id = ?')
    .run(next.name, next.color, next.avatar, next.role, id);
  return true;
}

/** Supprime une ligne ; les attributions liées disparaissent par ON DELETE CASCADE. */
export function deleteRow(db: Db, table: OrderedTable, id: number): boolean {
  return Number(db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id).changes) > 0;
}

/** Remplace les personnes attribuées à une tâche (les ids inconnus sont ignorés). */
export function setTaskMembers(db: Db, taskId: number, memberIds: number[]): boolean {
  if (!db.prepare('SELECT 1 FROM tasks WHERE id = ?').get(taskId)) return false;
  transaction(db, () => replaceTaskMembers(db, taskId, memberIds));
  return true;
}

/** Applique un tirage au sort (id de tâche → membres) en une seule transaction. */
export function applyDraw(db: Db, assignments: Map<number, number[]>): void {
  transaction(db, () => assignments.forEach((memberIds, taskId) => replaceTaskMembers(db, taskId, memberIds)));
}

function replaceTaskMembers(db: Db, taskId: number, memberIds: number[]): void {
  db.prepare('DELETE FROM task_members WHERE task_id = ?').run(taskId);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO task_members (task_id, member_id) SELECT ?, id FROM members WHERE id = ?',
  );
  for (const memberId of memberIds) insert.run(taskId, memberId);
}

/** Réordonne selon la liste d'ids fournie (position = index dans la liste). */
export function reorder(db: Db, table: OrderedTable, ids: number[]): void {
  const update = db.prepare(`UPDATE ${table} SET position = ? WHERE id = ?`);
  transaction(db, () => ids.forEach((id, index) => update.run(index, id)));
}

/** Remet les tâches récurrentes à « À faire » sans toucher aux attributions ni aux tâches ponctuelles. */
export function resetRecurringTasks(db: Db): void {
  db.prepare('UPDATE tasks SET done = 0 WHERE recurring = 1').run();
}
