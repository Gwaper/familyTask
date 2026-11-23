import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { Hono, type Context } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import type { MemberFields, TaskInput } from '../shared/types.ts';
import {
  createMember, createTask, deleteRow, getBoard, reorder, resetRecurringTasks,
  setTaskMembers, updateMember, updateTask, type Db, type OrderedTable,
} from './db.ts';
import { readIds, readMember, readTask } from './validate.ts';

export interface AppOptions {
  db: Db;
  photosDir: string;
  /** Dossier du front buildé, relatif au répertoire courant. Absent en dev (Vite sert le front). */
  staticDir?: string;
}

const IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const badRequest = (c: Context) => c.json({ error: 'invalid body' }, 400);
const notFound = (c: Context) => c.json({ error: 'not found' }, 404);
const ok = (c: Context) => c.json({ ok: true });
const idParam = (c: Context): number => Number(c.req.param('id'));
const jsonBody = (c: Context): Promise<unknown> => c.req.json().catch(() => null);

export function createApp({ db, photosDir, staticDir }: AppOptions): Hono {
  const app = new Hono();

  app.get('/api/health', ok);
  app.get('/api/board', (c) => c.json(getBoard(db)));

  // Routes communes aux tâches et aux membres : réordonnancement et suppression.
  for (const table of ['tasks', 'members'] satisfies OrderedTable[]) {
    app.put(`/api/${table}/order`, async (c) => {
      const ids = readIds(await jsonBody(c), 'ids');
      if (!ids) return badRequest(c);
      reorder(db, table, ids);
      return ok(c);
    });
    app.delete(`/api/${table}/:id`, (c) => (deleteRow(db, table, idParam(c)) ? ok(c) : notFound(c)));
  }

  app.post('/api/tasks', async (c) => {
    const fields = readTask(await jsonBody(c), true);
    if (!fields) return badRequest(c);
    // readTask(…, true) garantit la présence de nameFr et icon.
    return c.json({ id: createTask(db, fields as TaskInput) }, 201);
  });
  app.patch('/api/tasks/:id', async (c) => {
    const fields = readTask(await jsonBody(c), false);
    if (!fields) return badRequest(c);
    return updateTask(db, idParam(c), fields) ? ok(c) : notFound(c);
  });
  app.put('/api/tasks/:id/members', async (c) => {
    const ids = readIds(await jsonBody(c), 'memberIds');
    if (!ids) return badRequest(c);
    return setTaskMembers(db, idParam(c), ids) ? ok(c) : notFound(c);
  });

  app.post('/api/members', async (c) => {
    const fields = readMember(await jsonBody(c), true);
    if (!fields) return badRequest(c);
    // readMember(…, true) garantit la présence de tous les champs.
    return c.json({ id: createMember(db, fields as MemberFields) }, 201);
  });
  app.patch('/api/members/:id', async (c) => {
    const fields = readMember(await jsonBody(c), false);
    if (!fields) return badRequest(c);
    return updateMember(db, idParam(c), fields) ? ok(c) : notFound(c);
  });

  app.post('/api/reset', (c) => {
    resetRecurringTasks(db);
    return ok(c);
  });

  app.get('/api/photos', async (c) => {
    const files = await readdir(photosDir).catch(() => []);
    return c.json(files.filter((f) => extname(f).toLowerCase() in IMAGE_TYPES).sort());
  });
  app.get('/photos/:file', async (c) => {
    const file = basename(c.req.param('file')); // empêche toute sortie du dossier photos
    const type = IMAGE_TYPES[extname(file).toLowerCase()];
    const data = type ? await readFile(join(photosDir, file)).catch(() => null) : null;
    if (!data) return notFound(c);
    return c.body(data, 200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' });
  });

  if (staticDir) {
    app.use('/*', serveStatic({ root: staticDir }));
    app.get('*', serveStatic({ path: join(staticDir, 'index.html') }));
  }

  return app;
}
