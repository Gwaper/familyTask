import { Manage } from './manage/Manage.tsx';
import { Ritual } from './ritual/Ritual.tsx';
import { isManagePath } from './routes.ts';
import { useBoard } from './useBoard.ts';

export function App() {
  const { board, mutate, setPaused } = useBoard();
  if (!board) return <div className="loading" aria-hidden="true">🧺</div>;
  return isManagePath(location.pathname)
    ? <Manage board={board} mutate={mutate} />
    : <Ritual board={board} mutate={mutate} setPaused={setPaused} />;
}
