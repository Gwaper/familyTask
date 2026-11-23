import { useEffect, useState } from 'react';
import { Manage } from './manage/Manage.tsx';
import { Ritual } from './ritual/Ritual.tsx';
import { useBoard } from './useBoard.ts';

const MANAGE_HASH = '#gestion';

function useHash(): string {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const update = () => setHash(location.hash);
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, []);
  return hash;
}

export function App() {
  const { board, mutate, setPaused } = useBoard();
  const hash = useHash();
  if (!board) return <div className="loading" aria-hidden="true">🧺</div>;
  return hash === MANAGE_HASH
    ? <Manage board={board} mutate={mutate} />
    : <Ritual board={board} mutate={mutate} setPaused={setPaused} />;
}
