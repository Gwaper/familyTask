import { describe, expect, it } from 'vitest';
import { PAPERS, postIt } from './postit.ts';

describe('postIt', () => {
  it('donne toujours le même aspect à une tâche', () => {
    expect(postIt(42)).toEqual(postIt(42));
  });

  it('varie les couleurs des tâches voisines', () => {
    const papers = new Set([1, 2, 3, 4, 5, 6].map((id) => postIt(id).paper));
    expect(papers.size).toBe(PAPERS.length);
  });

  it('reste penché, jamais droit', () => {
    for (let id = 0; id < 50; id++) expect(Math.abs(postIt(id).tilt)).toBeGreaterThanOrEqual(1);
  });
});
