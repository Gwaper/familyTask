import { describe, expect, it } from 'vitest';
import type { Board, Member, MemberRole, Task, TaskCrew } from './types.ts';
import { drawAssignments } from './draw.ts';

const member = (id: number, role: MemberRole): Member => ({ id, name: `m${id}`, color: '#000', avatar: '🙂', role, position: id });
const task = (id: number, crew: TaskCrew, done = false): Task => ({
  id, nameFr: `t${id}`, nameEs: '', icon: '🧸', done, recurring: true, crew, position: id, memberIds: [],
});

const papa = member(1, 'adult');
const maman = member(2, 'adult');
const lea = member(3, 'child');
const roles = (board: Board, ids: number[] = []) => ids.map((id) => board.members.find((m) => m.id === id)?.role);

describe('drawAssignments', () => {
  it('respecte le type de chaque tâche', () => {
    const board: Board = { members: [papa, maman, lea], tasks: [task(1, 'adult'), task(2, 'child_adult'), task(3, 'child')] };
    const result = drawAssignments(board);
    expect(roles(board, result.get(1))).toEqual(['adult']);
    expect(roles(board, result.get(2))).toEqual(['child', 'adult']);
    expect(roles(board, result.get(3))).toEqual(['child']);
  });

  it('équilibre les tâches entre les membres du même rôle', () => {
    const board: Board = { members: [papa, maman], tasks: [1, 2, 3, 4].map((id) => task(id, 'adult')) };
    const counts = [...drawAssignments(board).values()].flat().reduce(
      (acc, id) => acc.set(id, (acc.get(id) ?? 0) + 1),
      new Map<number, number>(),
    );
    expect(counts).toEqual(new Map([[1, 2], [2, 2]]));
  });

  it('ignore les tâches finies', () => {
    const board: Board = { members: [papa], tasks: [task(1, 'adult', true), task(2, 'adult')] };
    expect([...drawAssignments(board).keys()]).toEqual([2]);
  });

  it('laisse vide un rôle sans aucun membre', () => {
    const board: Board = { members: [papa], tasks: [task(1, 'child'), task(2, 'child_adult')] };
    const result = drawAssignments(board);
    expect(result.get(1)).toEqual([]);
    expect(result.get(2)).toEqual([papa.id]);
  });

  it('départage les égalités avec le hasard fourni', () => {
    const board: Board = { members: [papa, maman], tasks: [task(1, 'adult')] };
    expect(drawAssignments(board, () => 0).get(1)).toEqual([papa.id]);
    expect(drawAssignments(board, () => 0.99).get(1)).toEqual([maman.id]);
  });
});
