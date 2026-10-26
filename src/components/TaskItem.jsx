import { dueDate, isOverdue } from '../lib/dates.js';
import { formatDate } from '../lib/format.js';
import Button from './ui/Button.jsx';

const PRIORITY_STYLE = {
  high: 'bg-emerald-100 text-emerald-950 border border-emerald-300/60 dark:bg-emerald-950 dark:text-emerald-200',
  medium:
    'bg-amber-100 text-amber-950 border border-amber-300/60 dark:bg-amber-950 dark:text-amber-200',
  low: 'bg-stone-100 text-stone-800 border border-stone-200 dark:bg-stone-800 dark:text-stone-200',
};

export default function TaskItem({ task, eventDate, today, done, onToggle, onEdit, onRemove }) {
  const overdue = isOverdue(task, eventDate, today, done);
  const checkboxId = `task-${task.id}`;

  return (
    <li
      className={`flex flex-wrap items-start gap-3 rounded-2xl border p-3.5 shadow-sm transition-all ${
        overdue
          ? 'border-red-700 bg-red-50/80 dark:border-red-400 dark:bg-red-950/40'
          : 'border-amber-300/60 bg-white/95 dark:border-purple-800/40 dark:bg-[#130924]'
      }`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={done}
        onChange={onToggle}
        className="mt-1 size-5 shrink-0 rounded cursor-pointer accent-purple-950 dark:accent-amber-400"
      />
      <div className="min-w-48 flex-1">
        <label
          htmlFor={checkboxId}
          className={`font-medium ${done ? 'text-stone-500 line-through dark:text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}
        >
          {task.title}
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={
              overdue
                ? 'font-semibold text-red-800 dark:text-red-300'
                : 'text-stone-700 dark:text-stone-300'
            }
          >
            {overdue ? 'Overdue · was due ' : 'Due '}
            {formatDate(dueDate(eventDate, task.dueDaysBefore))}
          </span>
          <span className="rounded-full bg-cream px-2 py-0.5 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
            {task.category}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${PRIORITY_STYLE[task.priority]}`}
          >
            {task.priority} priority
          </span>
        </div>
      </div>
      <div className="ml-auto flex gap-1">
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit task ${task.title}`}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          aria-label={`Delete task ${task.title}`}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
