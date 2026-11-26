import type { Board, MemberFields, MemberInput, TaskFields, TaskInput } from '../../shared/types.ts';

export type Table = 'tasks' | 'members';

/** Le serveur demande le code famille (cookie absent ou périmé). */
export class Unauthorized extends Error {}

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(path, {
    method,
    headers: body === undefined || isForm ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined || isForm ? body : JSON.stringify(body),
  });
  if (res.status === 401) throw new Unauthorized();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  board: () => request<Board>('GET', '/api/board'),
  login: (code: string) => request('POST', '/api/login', { code }),
  createTask: (input: TaskInput) => request('POST', '/api/tasks', input),
  updateTask: (id: number, patch: Partial<TaskFields>) => request('PATCH', `/api/tasks/${id}`, patch),
  setTaskMembers: (id: number, memberIds: number[]) => request('PUT', `/api/tasks/${id}/members`, { memberIds }),
  createMember: (input: MemberInput) => request('POST', '/api/members', input),
  updateMember: (id: number, patch: Partial<MemberFields>) => request('PATCH', `/api/members/${id}`, patch),
  remove: (table: Table, id: number) => request('DELETE', `/api/${table}/${id}`),
  reset: () => request('POST', '/api/reset'),
  draw: () => request('POST', '/api/draw'),
};
