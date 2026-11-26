import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Board } from '../shared/types.ts';
import { createApp, photoFileName } from './app.ts';
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

  it('tire au sort les tâches « À faire » selon adulte / enfant', async () => {
    const res = await send('POST', '/api/members', { name: 'Léa', color: '#22c55e', avatar: '👧', role: 'child' });
    const { id: lea } = await res.json();
    const { tasks } = await board();
    await send('PATCH', `/api/tasks/${tasks[0].id}`, { crew: 'child' });
    await send('PATCH', `/api/tasks/${tasks[1].id}`, { done: true });
    expect((await send('POST', '/api/draw')).status).toBe(200);
    const after = (await board()).tasks;
    expect(after[0].memberIds).toEqual([lea]);
    expect(after[1].memberIds).toEqual([]);
  });

  it('refuse un rôle ou un type de tâche inconnu', async () => {
    expect((await send('POST', '/api/members', { name: 'Léa', color: '#000', avatar: '👧', role: 'bebe' })).status).toBe(400);
    expect((await send('PATCH', '/api/tasks/1', { crew: 'tous' })).status).toBe(400);
  });

  it('liste zéro photo si le dossier est absent et refuse les chemins hors du dossier', async () => {
    expect(await (await send('GET', '/api/photos')).json()).toEqual([]);
    expect((await send('GET', '/photos/..%2F..%2Fetc%2Fpasswd')).status).toBe(404);
  });
});

describe('code famille', () => {
  beforeEach(() => {
    app = createApp({ db: openDb(':memory:'), photosDir: '/nonexistent', familyCode: 'soleil' });
  });

  it("refuse l'API et les photos sans cookie, laisse passer health", async () => {
    expect((await send('GET', '/api/board')).status).toBe(401);
    expect((await send('GET', '/photos/a.jpg')).status).toBe(401);
    expect((await send('GET', '/api/health')).status).toBe(200);
  });

  it('refuse un mauvais code, accepte le bon et pose un cookie valable', async () => {
    expect((await send('POST', '/api/login', { code: 'lune' })).status).toBe(401);
    expect((await send('POST', '/api/login', {})).status).toBe(401);
    const res = await send('POST', '/api/login', { code: ' soleil ' });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie') ?? '';
    expect(cookie).toMatch(/HttpOnly/);
    const authed = await app.request('/api/board', { headers: { Cookie: cookie.split(';')[0] } });
    expect(authed.status).toBe(200);
  });
});

describe('upload de photos', () => {
  let photosDir: string;
  const upload = (name: string, size = 10) => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(size)], name));
    return app.request('/api/photos', { method: 'POST', body: form });
  };

  beforeEach(() => {
    photosDir = mkdtempSync(join(tmpdir(), 'kanban-photos-'));
    app = createApp({ db: openDb(':memory:'), photosDir });
  });

  it("enregistre l'image sous un nom sûr et la liste", async () => {
    const res = await upload('Photo Léa.JPG');
    expect(res.status).toBe(201);
    const { file } = await res.json();
    expect(file).toMatch(/^\d+-photo-l-a\.jpg$/);
    expect(readdirSync(photosDir)).toEqual([file]);
    expect(await (await send('GET', '/api/photos')).json()).toEqual([file]);
  });

  it('refuse un fichier non image ou trop gros', async () => {
    expect((await upload('script.sh')).status).toBe(400);
    expect((await upload('grosse.jpg', 6 * 1024 * 1024)).status).toBe(413);
    expect(readdirSync(photosDir)).toEqual([]);
  });

  it('nettoie le nom de fichier', () => {
    expect(photoFileName('../../etc/Mon Doudou!.png', 1)).toBe('1-mon-doudou-.png');
  });
});
