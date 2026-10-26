import { lazy, Suspense, useState } from 'react';
import { budgetBreakdown, budgetTotals, progressPercent } from '../lib/budget.js';
import { formatINR } from '../lib/format.js';
import CategoryRow from './CategoryRow.jsx';
import ExpenseForm from './ExpenseForm.jsx';
import ExpenseList from './ExpenseList.jsx';
import Card from './ui/Card.jsx';

const BudgetCharts = lazy(() => import('./BudgetCharts.jsx'));

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-amber-200/70 bg-cream/60 p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-sm text-stone-700 dark:text-stone-300">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-bold sm:text-2xl ${
          tone === 'danger' ? 'text-red-800 dark:text-red-300' : 'text-stone-900 dark:text-stone-50'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function BudgetTab({ event, dispatch, today }) {
  const [editing, setEditing] = useState(null);
  const { meta, plan, expenses } = event;
  const rows = budgetBreakdown(meta.budget, plan.budget.categories, expenses);
  const totals = budgetTotals(meta.budget, plan.budget.categories, expenses);
  const overspent = totals.overTotal || totals.overCategories.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Budget</h2>
      {overspent && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-red-700 bg-red-50 p-4 text-red-900 dark:border-red-400 dark:bg-red-950/60 dark:text-red-100"
        >
          <p className="font-semibold">
            <span aria-hidden="true">🚨 </span>Over budget
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {totals.overTotal && (
              <li>Total spending is {formatINR(totals.spent - totals.total)} over your budget.</li>
            )}
            {totals.overCategories.map((c) => (
              <li key={c.id}>
                {c.name} is {formatINR(c.spent - c.allocated)} over its allocation.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <Stat label="Total budget" value={formatINR(totals.total)} />
        <Stat
          label="Spent"
          value={formatINR(totals.spent)}
          tone={totals.overTotal ? 'danger' : ''}
        />
        <Stat
          label="Remaining"
          value={formatINR(totals.remaining)}
          tone={totals.remaining < 0 ? 'danger' : ''}
        />
      </div>

      <Card aria-labelledby="categories-title">
        <h3
          id="categories-title"
          className="text-lg font-semibold text-rose-900 dark:text-amber-300"
        >
          Categories
        </h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Change any share — the others rebalance so the total stays 100%.
        </p>
        <ul className="mt-4 divide-y divide-amber-100 dark:divide-stone-800">
          {rows.map((row) => (
            <CategoryRow
              key={`${row.id}-${row.percent}`}
              row={row}
              progress={progressPercent(row.spent, row.allocated)}
              onPercent={(percent) => dispatch({ type: 'budget/setPercent', id: row.id, percent })}
            />
          ))}
        </ul>
      </Card>

      <Suspense
        fallback={
          <Card>
            <p role="status">Loading charts…</p>
          </Card>
        }
      >
        <BudgetCharts rows={rows} />
      </Suspense>

      <Card aria-labelledby="expenses-title">
        <h3 id="expenses-title" className="text-lg font-semibold text-rose-900 dark:text-amber-300">
          Expenses
        </h3>
        <ExpenseForm
          key={editing?.id ?? 'new'}
          categories={plan.budget.categories}
          today={today}
          initial={editing}
          onCancel={editing ? () => setEditing(null) : undefined}
          onSave={(expense) => {
            if (editing) dispatch({ type: 'expense/update', id: editing.id, changes: expense });
            else dispatch({ type: 'expense/add', expense });
            setEditing(null);
          }}
        />
        <ExpenseList
          expenses={expenses}
          categories={plan.budget.categories}
          onEdit={setEditing}
          onRemove={(id) => dispatch({ type: 'expense/remove', id })}
        />
      </Card>
    </div>
  );
}
