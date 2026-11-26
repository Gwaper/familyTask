import { useCallback, useEffect, useRef, useState } from 'react';
import type { Board } from '../../shared/types.ts';
import { api, Unauthorized } from './api.ts';

const POLL_MS = 3000;

export type Mutate = (call: () => Promise<unknown>, optimistic?: (board: Board) => Board) => Promise<void>;

/**
 * État du tableau synchronisé par polling (3 s).
 * Chaque modification locale incrémente `version` : une réponse de polling partie avant
 * est ignorée, pour ne pas écraser la mise à jour optimiste.
 */
export function useBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [locked, setLocked] = useState(false);
  const version = useRef(0);
  const paused = useRef(false);

  const refresh = useCallback(async () => {
    const started = version.current;
    try {
      const next = await api.board();
      setLocked(false);
      if (started === version.current) setBoard(next);
    } catch (error) {
      // Code famille requis ; sinon serveur momentanément injoignable : on garde l'affichage actuel.
      if (error instanceof Unauthorized) setLocked(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const mutate: Mutate = useCallback(async (call, optimistic) => {
    version.current++;
    if (optimistic) setBoard((current) => current && optimistic(current));
    try {
      await call();
    } finally {
      // En cas d'échec, l'état du serveur remplace la mise à jour optimiste.
      await refresh();
    }
  }, [refresh]);

  const setPaused = useCallback((value: boolean) => {
    paused.current = value;
  }, []);

  return { board, locked, refresh, mutate, setPaused };
}
