import { useEffect, useRef, useState } from 'react';
import { MANAGE_PATH } from '../routes.ts';
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { drawAssignments } from '../../../shared/draw.ts';
import type { Board, Task } from '../../../shared/types.ts';
import { api } from '../api.ts';
import { allDone, assignedMembers, patchTask, toggleId } from '../board.ts';
import { launchConfetti, playAllDoneSound, playDoneSound, playTickSound } from '../celebrate.ts';
import { both, t } from '../i18n.ts';
import { say } from '../speech.ts';
import type { Mutate } from '../useBoard.ts';
import { AvatarPicker } from './AvatarPicker.tsx';
import { DieIcon, GearIcon } from '../icons.tsx';
import { postItStyle } from './postit.ts';
import { CardContent, TaskCard } from './TaskCard.tsx';
import { Column, type ColumnKind } from './Column.tsx';

interface Props {
  board: Board;
  mutate: Mutate;
  setPaused: (paused: boolean) => void;
}

/** Après un glisser, le navigateur peut émettre un clic : on l'ignore pendant ce délai. */
const CLICK_AFTER_DRAG_MS = 300;
/** Durée minimale de l'animation du tirage au sort, et rythme des avatars qui défilent. */
const ROLL_MS = 1800;
const ROLL_TICK_MS = 150;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function Ritual({ board, mutate, setPaused }: Props) {
  const [picker, setPicker] = useState<{ taskId: number; ask: boolean } | null>(null);
  const [celebrated, setCelebrated] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const lastDragEnd = useRef(0);
  const [rolling, setRolling] = useState(false);
  /** Attributions affichées pendant l'animation (tirages provisoires, côté écran seulement). */
  const [preview, setPreview] = useState<Map<number, number[]> | null>(null);

  useEffect(() => {
    if (!rolling) return setPreview(null);
    const timer = setInterval(() => {
      setPreview(drawAssignments(board));
      playTickSound();
    }, ROLL_TICK_MS);
    return () => clearInterval(timer);
  }, [rolling, board]);

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

  /** Le vrai tirage est fait par le serveur ; l'animation dure au moins ROLL_MS. */
  function drawTasks() {
    if (rolling) return;
    setRolling(true);
    void mutate(() => Promise.all([api.draw(), wait(ROLL_MS)])).finally(() => {
      setRolling(false);
      playDoneSound();
    });
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
      <Column
        kind={kind}
        action={kind === 'todo' ? (
          <button className="draw-button" onClick={drawTasks} disabled={rolling} aria-label={both(t.draw)} title={both(t.draw)}>
            <span className="die"><DieIcon /></span>
          </button>
        ) : (
          <a className="manage-link" href={MANAGE_PATH} aria-label={both(t.manage)} title={both(t.manage)}>
            <span className="manage-dot"><GearIcon /></span>
          </a>
        )}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={assignedMembers(board, { ...task, memberIds: preview?.get(task.id) ?? task.memberIds })}
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
    <main className={rolling ? 'ritual rolling' : 'ritual'}>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={endDrag}>
        <div className="columns">
          {renderColumn('todo')}
          <div className="columns-separator" aria-hidden="true" />
          {renderColumn('done')}
        </div>
        <DragOverlay>
          {dragged && (
            <div className={dragged.done ? 'card card-done card-overlay' : 'card card-overlay'} style={postItStyle(dragged.id)}>
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
