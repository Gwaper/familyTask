import { describe, expect, it } from 'vitest';
import type { Board, Task } from '../../shared/types.ts';
import { allDone, assignedMembers, moveItem, patchTask, toggleId } from './board.ts';

const task = (id: number, done: boolean, memberIds: number[] = []): Task =>
  ({ id, nameFr: `T${id}`, nameEs: '', icon: '🧸', done, recurring: true, position: id, memberIds });
const board: Board = {
  members: [
    { id: 1, name: 'Papa', color: '#000', avatar: '👨', position: 0 },
    { id: 2, name: 'Léa', color: '#111', avatar: '👧', position: 1 },
  ],
  tasks: [task(1, false, [2, 1]), task(2, true)],
};

describe('board', () => {
  it('patchTask renvoie un nouveau tableau sans muter l’original', () => {
    const next = patchTask(board, 1, { done: true });
    expect(next.tasks[0].done).toBe(true);
    expect(board.tasks[0].done).toBe(false);
  });

  it('toggleId ajoute ou retire (attribution multiple)', () => {
    expect(toggleId([1], 2)).toEqual([1, 2]);
    expect(toggleId([1, 2], 1)).toEqual([2]);
  });

  it('allDone', () => {
    expect(allDone(board.tasks)).toBe(false);
    expect(allDone(patchTask(board, 1, { done: true }).tasks)).toBe(true);
    expect(allDone([])).toBe(false);
  });

  it('assignedMembers suit l’ordre des membres', () => {
    expect(assignedMembers(board, board.tasks[0]).map((m) => m.name)).toEqual(['Papa', 'Léa']);
  });

  it('moveItem', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    const items = ['a'];
    expect(moveItem(items, 0, -1)).toBe(items);
  });
});
