import { beforeEach, describe, expect, it } from 'vitest';
import type { Board } from '../shared/types.ts';
import { createApp } from './app.ts';
import { openDb } from './db.ts';

let app: ReturnType<typeof createApp>;
const send = (method: string, path: string, body?: unknown) =>
  app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
const board = async (): Promise<Board> => (await send('GET', '/api/board')).json();

beforeEach(() => {
  app = createApp({ db: openDb(':memory:'), photosDir: '/nonexistent' });
});

describe('API', () => {
  it('crée une tâche sans nom espagnol, la finit puis la supprime', async () => {
    const res = await send('POST', '/api/tasks', { nameFr: '  Se brosser les dents ', icon: '🪥' });
    expect(res.status).toBe(201);
    const { id } = await res.json();
    expect((await board()).tasks.find((t) => t.id === id)).toMatchObject({ nameFr: 'Se brosser les dents', nameEs: '' });
    expect((await send('PATCH', `/api/tasks/${id}`, { done: true })).status).toBe(200);
    expect((await board()).tasks.find((t) => t.id === id)?.done).toBe(true);
    expect((await send('DELETE', `/api/tasks/${id}`)).status).toBe(200);
    expect((await send('DELETE', `/api/tasks/${id}`)).status).toBe(404);
  });

  it('refuse les corps invalides', async () => {
    expect((await send('POST', '/api/tasks', { nameFr: '', icon: '🧸' })).status).toBe(400);
    expect((await send('POST', '/api/tasks', { nameFr: 'X' })).status).toBe(400);
    expect((await send('PATCH', '/api/tasks/1', { done: 'oui' })).status).toBe(400);
    expect((await send('POST', '/api/members', { name: 'Léa' })).status).toBe(400);
    expect((await send('PUT', '/api/tasks/1/members', { memberIds: ['a'] })).status).toBe(400);
  });

  it('attribue plusieurs membres et remet à zéro manuellement', async () => {
    const { members, tasks } = await board();
    const ids = members.map((m) => m.id);
    await send('PUT', `/api/tasks/${tasks[0].id}/members`, { memberIds: ids });
    await send('PATCH', `/api/tasks/${tasks[0].id}`, { done: true });
    await send('POST', '/api/reset');
    expect((await board()).tasks[0]).toMatchObject({ done: false, memberIds: ids });
  });

  it('liste zéro photo si le dossier est absent et refuse les chemins hors du dossier', async () => {
    expect(await (await send('GET', '/api/photos')).json()).toEqual([]);
    expect((await send('GET', '/photos/..%2F..%2Fetc%2Fpasswd')).status).toBe(404);
  });
});
