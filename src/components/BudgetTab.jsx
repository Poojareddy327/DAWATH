import { lazy, Suspense, useState } from 'react';
import { budgetBreakdown, budgetTotals, progressPercent } from '../lib/budget.js';
import { formatINR } from '../lib/format.js';
import { buildBudgetLedgerCsv, downloadCsvFile } from '../lib/csv.js';
import CategoryRow from './CategoryRow.jsx';
import ExpenseForm from './ExpenseForm.jsx';
import ExpenseList from './ExpenseList.jsx';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';

const BudgetCharts = lazy(() => import('./BudgetCharts.jsx'));

function Stat({ label, value, tone, icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-white via-amber-50/40 to-white p-4 shadow-sm backdrop-blur-sm dark:border-emerald-800/40 dark:from-[#06241b] dark:via-[#041a14] dark:to-[#06241b]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300">{label}</p>
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p
        className={`mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl ${
          tone === 'danger'
            ? 'text-red-700 dark:text-red-400'
            : 'text-emerald-950 dark:text-amber-200'
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
        <Stat label="Total budget" value={formatINR(totals.total)} icon="🪙" />
        <Stat
          label="Spent"
          value={formatINR(totals.spent)}
          tone={totals.overTotal ? 'danger' : ''}
          icon="💸"
        />
        <Stat
          label="Remaining"
          value={formatINR(totals.remaining)}
          tone={totals.remaining < 0 ? 'danger' : ''}
          icon="✨"
        />
      </div>

      {/* Interactive Per-Guest & Catering Intelligence */}
      <div className="rounded-2xl border border-amber-300/70 bg-gradient-to-r from-purple-50/70 via-white to-amber-50/70 p-4 shadow-sm dark:border-purple-800/40 dark:from-[#150a2b] dark:via-[#110724] dark:to-[#170a30]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-purple-950 dark:text-amber-300">
              Per-Guest & Catering Intelligence
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              For {meta.guests} invited guests · Avg overall spend: ₹
              {Math.round(totals.total / (meta.guests || 1))} / guest
            </p>
          </div>
          <span className="rounded-full border border-purple-300/80 bg-white px-3.5 py-1 text-xs font-bold text-purple-900 shadow-2xs dark:border-purple-700 dark:bg-purple-950 dark:text-amber-300">
            🍽️ Est. Catering Plate: ₹
            {Math.round(
              (rows.find((r) => r.id === 'catering')?.allocated ?? totals.total * 0.35) /
                (meta.guests || 1),
            )}{' '}
            / plate
          </span>
        </div>
      </div>

      <Card aria-labelledby="categories-title">
        <h3
          id="categories-title"
          className="text-lg font-semibold text-purple-950 dark:text-amber-300"
        >
          Categories
        </h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Change any share — the others rebalance so the total stays 100%.
        </p>
        <ul className="mt-4 divide-y divide-purple-100/80 dark:divide-purple-900/40">
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
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3
            id="expenses-title"
            className="text-lg font-semibold text-purple-950 dark:text-amber-300"
          >
            Expenses
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const csv = buildBudgetLedgerCsv(event);
              downloadCsvFile(`dawat-budget-ledger-${event.meta.city.toLowerCase()}.csv`, csv);
            }}
          >
            📥 Export CSV Ledger
          </Button>
        </div>
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
