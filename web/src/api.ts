import type { Board, MemberFields, TaskFields, TaskInput } from '../../shared/types.ts';

export type Table = 'tasks' | 'members';

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  board: () => request<Board>('GET', '/api/board'),
  photos: () => request<string[]>('GET', '/api/photos'),
  createTask: (input: TaskInput) => request('POST', '/api/tasks', input),
  updateTask: (id: number, patch: Partial<TaskFields>) => request('PATCH', `/api/tasks/${id}`, patch),
  setTaskMembers: (id: number, memberIds: number[]) => request('PUT', `/api/tasks/${id}/members`, { memberIds }),
  createMember: (input: MemberFields) => request('POST', '/api/members', input),
  updateMember: (id: number, patch: Partial<MemberFields>) => request('PATCH', `/api/members/${id}`, patch),
  remove: (table: Table, id: number) => request('DELETE', `/api/${table}/${id}`),
  reorder: (table: Table, ids: number[]) => request('PUT', `/api/${table}/order`, { ids }),
  reset: () => request('POST', '/api/reset'),
};
