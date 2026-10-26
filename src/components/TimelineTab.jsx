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
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { meta, plan, state } = event;
  const daysLeft = daysBetween(today, meta.date);
  const done = new Set(state.doneTaskIds);
  const doneCount = plan.tasks.filter((t) => done.has(t.id)).length;
  const progress = progressPercent(doneCount, plan.tasks.length);

  const filteredTasks = plan.tasks.filter((t) => {
    if (filter === 'pending' && done.has(t.id)) return false;
    if (filter === 'done' && !done.has(t.id)) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groups = groupTasksByPhase(filteredTasks);
  const maxDays = Math.max(0, daysLeft);

  return (
    <div className="space-y-6">
      <Card aria-labelledby="countdown-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="countdown-title"
              className="font-display text-3xl font-bold text-purple-950 dark:text-amber-300"
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

        {/* Milestone Search & Status Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-purple-100 pt-3 dark:border-purple-900/50">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search milestones…"
            aria-label="Search milestones"
            className="min-h-9 flex-1 rounded-full border border-amber-300/60 bg-white px-3.5 text-xs text-stone-900 shadow-xs focus:border-purple-800 focus:outline-none dark:border-purple-800/60 dark:bg-[#130924] dark:text-stone-100"
          />
          <div role="group" aria-label="Filter tasks by status" className="flex gap-1.5">
            {[
              ['all', `All (${plan.tasks.length})`],
              ['pending', `Pending (${plan.tasks.length - doneCount})`],
              ['done', `Done (${doneCount})`],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilter(val)}
                className={`min-h-8 rounded-full border px-3 text-xs font-semibold transition-all ${
                  filter === val
                    ? 'border-amber-400/50 bg-gradient-to-r from-purple-950 to-indigo-900 text-amber-200 shadow-2xs dark:from-amber-400 dark:to-yellow-500 dark:text-purple-950 dark:border-transparent'
                    : 'border-amber-200/70 bg-white/90 text-stone-700 hover:bg-purple-50 dark:border-purple-800/40 dark:bg-[#130924] dark:text-stone-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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

      {filteredTasks.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {search.trim()
              ? `No milestones match "${search}". Try another search term or filter.`
              : 'No milestones match this filter.'}
          </p>
        </Card>
      ) : (
        PHASES.map((phase) =>
          groups[phase.key].length === 0 ? null : (
            <section key={phase.key} aria-labelledby={`phase-${phase.key}`}>
              <h3
                id={`phase-${phase.key}`}
                className="mb-2 text-lg font-semibold text-stone-900 dark:text-stone-100"
              >
                {phase.label}
                <span className="ml-2 text-sm font-normal text-stone-600 dark:text-stone-400">
                  ({groups[phase.key].filter((t) => done.has(t.id)).length}/
                  {groups[phase.key].length})
                </span>
              </h3>
              <ul className="space-y-2">
                {groups[phase.key].map((task) =>
                  editingId === task.id ? (
                    <li
                      key={task.id}
                      className="rounded-2xl border border-amber-300/60 bg-white p-3 dark:border-purple-800/60 dark:bg-[#130924]"
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
        )
      )}
    </div>
  );
}
