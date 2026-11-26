import { Login } from './Login.tsx';
import { Manage } from './manage/Manage.tsx';
import { Ritual } from './ritual/Ritual.tsx';
import { isManagePath } from './routes.ts';
import { useBoard } from './useBoard.ts';

export function App() {
  const { board, locked, refresh, mutate, setPaused } = useBoard();
  if (locked) return <Login onSuccess={refresh} />;
  if (!board) return <div className="loading" aria-hidden="true">🧺</div>;
  return isManagePath(location.pathname)
    ? <Manage board={board} mutate={mutate} />
    : <Ritual board={board} mutate={mutate} setPaused={setPaused} />;
}
