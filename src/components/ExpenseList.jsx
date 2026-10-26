import { formatDate, formatINR } from '../lib/format.js';
import Button from './ui/Button.jsx';

export default function ExpenseList({ expenses, categories, onEdit, onRemove }) {
  if (expenses.length === 0) {
    return (
      <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
        No expenses yet. Log advances and payments here to track spending against each category.
      </p>
    );
  }
  const nameOf = (id) => categories.find((c) => c.id === id)?.name ?? 'Uncategorised';
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul
      className="mt-4 divide-y divide-amber-100 dark:divide-stone-800"
      aria-label="Logged expenses"
    >
      {sorted.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <div className="min-w-0">
            <p className="font-medium text-stone-900 dark:text-stone-100">{e.label}</p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {nameOf(e.categoryId)} · {formatDate(e.date)}
              {e.note && ` · ${e.note}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatINR(e.amount)}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(e)}
              aria-label={`Edit expense ${e.label}`}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(e.id)}
              aria-label={`Delete expense ${e.label}`}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
