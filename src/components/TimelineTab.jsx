import { useState } from 'react';
import { progressPercent } from '../lib/budget.js';
import { PHASES } from '../lib/constants.js';
import { countdownLabel, daysBetween, groupTasksByPhase } from '../lib/dates.js';
import TaskForm from './TaskForm.jsx';
import TaskItem from './TaskItem.jsx';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import ProgressBar from './ui/ProgressBar.jsx';

export default function TimelineTab({ event, dispatch, today }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { meta, plan, state } = event;
  const daysLeft = daysBetween(today, meta.date);
  const done = new Set(state.doneTaskIds);
  const doneCount = plan.tasks.filter((t) => done.has(t.id)).length;
  const progress = progressPercent(doneCount, plan.tasks.length);
  const groups = groupTasksByPhase(plan.tasks);
  const maxDays = Math.max(0, daysLeft);

  return (
    <div className="space-y-6">
      <Card aria-labelledby="countdown-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="countdown-title"
              className="font-display text-3xl font-bold text-rose-900 dark:text-amber-300"
            >
              {countdownLabel(daysLeft)}
            </h2>
            <p className="text-stone-700 dark:text-stone-300">
              {doneCount} of {plan.tasks.length} tasks done · {progress}% complete
            </p>
          </div>
          <Button onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
            {adding ? 'Close' : '+ Add task'}
          </Button>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} label={`Overall progress: ${progress}% of tasks done`} />
        </div>
        {adding && (
          <TaskForm
            idPrefix="new-task"
            maxDays={maxDays}
            onCancel={() => setAdding(false)}
            onSave={(task) => {
              dispatch({ type: 'task/add', task });
              setAdding(false);
            }}
          />
        )}
      </Card>

      {PHASES.map((phase) =>
        groups[phase.key].length === 0 ? null : (
          <section key={phase.key} aria-labelledby={`phase-${phase.key}`}>
            <h3
              id={`phase-${phase.key}`}
              className="mb-2 text-lg font-semibold text-stone-900 dark:text-stone-100"
            >
              {phase.label}
              <span className="ml-2 text-sm font-normal text-stone-600 dark:text-stone-400">
                ({groups[phase.key].filter((t) => done.has(t.id)).length}/{groups[phase.key].length}
                )
              </span>
            </h3>
            <ul className="space-y-2">
              {groups[phase.key].map((task) =>
                editingId === task.id ? (
                  <li
                    key={task.id}
                    className="rounded-2xl border border-amber-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900"
                  >
                    <TaskForm
                      idPrefix={`edit-${task.id}`}
                      initial={task}
                      maxDays={Math.max(maxDays, task.dueDaysBefore)}
                      onCancel={() => setEditingId(null)}
                      onSave={(changes) => {
                        dispatch({ type: 'task/update', id: task.id, changes });
                        setEditingId(null);
                      }}
                    />
                  </li>
                ) : (
                  <TaskItem
                    key={task.id}
                    task={task}
                    eventDate={meta.date}
                    today={today}
                    done={done.has(task.id)}
                    onToggle={() => dispatch({ type: 'task/toggle', id: task.id })}
                    onEdit={() => setEditingId(task.id)}
                    onRemove={() => dispatch({ type: 'task/remove', id: task.id })}
                  />
                ),
              )}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}
