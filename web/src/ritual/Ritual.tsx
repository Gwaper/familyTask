import { useRef, useState } from 'react';
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import type { Board, Task } from '../../../shared/types.ts';
import { api } from '../api.ts';
import { allDone, assignedMembers, patchTask, toggleId } from '../board.ts';
import { launchConfetti, playAllDoneSound, playDoneSound } from '../celebrate.ts';
import { t } from '../i18n.ts';
import { say } from '../speech.ts';
import type { Mutate } from '../useBoard.ts';
import { AvatarPicker } from './AvatarPicker.tsx';
import { CardContent, TaskCard } from './TaskCard.tsx';
import { Column, type ColumnKind } from './Column.tsx';

interface Props {
  board: Board;
  mutate: Mutate;
  setPaused: (paused: boolean) => void;
}

/** Après un glisser, le navigateur peut émettre un clic : on l'ignore pendant ce délai. */
const CLICK_AFTER_DRAG_MS = 300;

export function Ritual({ board, mutate, setPaused }: Props) {
  const [picker, setPicker] = useState<{ taskId: number; ask: boolean } | null>(null);
  const [celebrated, setCelebrated] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const lastDragEnd = useRef(0);

  // Léger délai d'appui au doigt pour laisser le défilement fonctionner.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const findTask = (id: number) => board.tasks.find((task) => task.id === id);

  function setDone(task: Task, done: boolean) {
    if (task.done === done) return;
    void mutate(() => api.updateTask(task.id, { done }), (b) => patchTask(b, task.id, { done }));
    if (!done) return setCelebrated(null);

    setCelebrated(task.id);
    if (allDone(patchTask(board, task.id, { done }).tasks)) {
      playAllDoneSound();
      launchConfetti();
    } else {
      playDoneSound();
    }
    if (task.memberIds.length === 0) {
      setPicker({ taskId: task.id, ask: true });
      say(t.whoDidIt);
    }
  }

  function toggleMember(task: Task, memberId: number) {
    const memberIds = toggleId(task.memberIds, memberId);
    void mutate(() => api.setTaskMembers(task.id, memberIds), (b) => patchTask(b, task.id, { memberIds }));
  }

  function openPicker(task: Task) {
    if (Date.now() - lastDragEnd.current > CLICK_AFTER_DRAG_MS) setPicker({ taskId: task.id, ask: false });
  }

  function endDrag() {
    setDraggedId(null);
    setPaused(false);
    lastDragEnd.current = Date.now();
  }

  function onDragStart(event: DragStartEvent) {
    setDraggedId(Number(event.active.id));
    setPaused(true);
  }

  function onDragEnd(event: DragEndEvent) {
    endDrag();
    const task = findTask(Number(event.active.id));
    if (task && event.over) setDone(task, event.over.id === 'done');
  }

  const renderColumn = (kind: ColumnKind) => {
    const tasks = board.tasks.filter((task) => task.done === (kind === 'done'));
    return (
      <Column kind={kind}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={assignedMembers(board, task)}
            celebrate={celebrated === task.id}
            onOpen={() => openPicker(task)}
            onMove={() => setDone(task, !task.done)}
          />
        ))}
        {kind === 'todo' && tasks.length === 0 && board.tasks.length > 0 && (
          <div className="all-done" aria-hidden="true">🎉</div>
        )}
      </Column>
    );
  };

  const dragged = draggedId === null ? undefined : findTask(draggedId);
  const pickerTask = picker ? findTask(picker.taskId) : undefined;

  return (
    <main className="ritual">
      <a className="manage-link" href="#gestion" aria-label={t.manage.fr}>⚙️</a>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={endDrag}>
        <div className="columns">
          {renderColumn('todo')}
          {renderColumn('done')}
        </div>
        <DragOverlay>
          {dragged && (
            <div className="card card-overlay">
              <CardContent task={dragged} members={assignedMembers(board, dragged)} onOpen={() => {}} onMove={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {picker && pickerTask && (
        <AvatarPicker
          task={pickerTask}
          members={board.members}
          ask={picker.ask}
          onToggle={(memberId) => toggleMember(pickerTask, memberId)}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
