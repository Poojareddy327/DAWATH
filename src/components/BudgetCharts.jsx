// Code-split: Recharts loads only when the Budget tab renders.
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useIsDark } from '../hooks/useIsDark.js';
import { formatINR } from '../lib/format.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';

// Validated categorical palette: Royal Deccani Amethyst, Nizam Gold, Golconda Teal, Purple Zari
const SERIES = {
  light: ['#4c1d95', '#d97706', '#0891b2', '#7e22ce', '#b45309', '#0284c7', '#9333ea', '#ca8a04'],
  dark: ['#a855f7', '#fbbf24', '#22d3ee', '#c084fc', '#f59e0b', '#38bdf8', '#e879f9', '#fde047'],
};

const compactINR = (n) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L` : `₹${Math.round(n / 1000)}k`;

function TableView({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <caption className="sr-only">Budget allocation and spending by category</caption>
        <thead>
          <tr className="border-b border-amber-200 text-stone-700 dark:border-stone-700 dark:text-stone-300">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Category
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">
              Share
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">
              Allocated
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              Spent
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-amber-100 dark:border-stone-800">
              <th scope="row" className="py-2 pr-3 font-medium">
                {r.name}
              </th>
              <td className="py-2 pr-3 text-right">{r.percent}%</td>
              <td className="py-2 pr-3 text-right">{formatINR(r.allocated)}</td>
              <td
                className={`py-2 text-right ${r.overspent ? 'font-semibold text-red-800 dark:text-red-300' : ''}`}
              >
                {formatINR(r.spent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BudgetCharts({ rows }) {
  const [asTable, setAsTable] = useState(false);
  const [selectedId, setSelectedId] = useState(() => rows[0]?.id ?? null);
  const dark = useIsDark();
  const colors = dark ? SERIES.dark : SERIES.light;
  const ink = dark ? '#d6d3d1' : '#44403c';
  const grid = dark ? '#292524' : '#f5e9d3';
  const surface = dark ? '#130924' : '#ffffff';
  const tooltipStyle = {
    background: surface,
    border: `1px solid ${grid}`,
    borderRadius: 12,
    color: ink,
  };

  const selectedRow = rows.find((r) => r.id === selectedId) ?? rows[0];
  const totalAllocated = rows.reduce((s, r) => s + r.allocated, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const overallUtilized = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <Card aria-labelledby="charts-title" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            id="charts-title"
            className="text-lg font-semibold text-purple-950 dark:text-amber-300"
          >
            Budget at a glance
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Interactive visual analytics & category spend efficiency ({overallUtilized}% allocated
            utilized)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
          >
            {asTable ? 'View as charts' : 'View as table'}
          </Button>
        </div>
      </div>

      {/* Category Spotlight & Analytics Card */}
      {selectedRow && !asTable && (
        <div className="rounded-2xl border border-amber-300/70 bg-gradient-to-r from-purple-50/60 via-white to-amber-50/50 p-4 shadow-sm backdrop-blur-sm dark:border-purple-800/40 dark:from-[#190c33] dark:via-[#130924] dark:to-[#170a30]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-purple-950 dark:text-amber-200">
                  Spotlight: {selectedRow.name}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedRow.overspent
                      ? 'border border-red-300 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'
                      : selectedRow.spent > selectedRow.allocated * 0.85
                        ? 'border border-amber-300 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200'
                        : 'border border-emerald-300 bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200'
                  }`}
                >
                  {selectedRow.overspent
                    ? '🚨 Over Budget'
                    : selectedRow.spent > selectedRow.allocated * 0.85
                      ? '⚠️ 85%+ Utilized'
                      : '✓ Healthy Buffer'}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                Share: {selectedRow.percent}% · Allocated: {formatINR(selectedRow.allocated)} ·
                Spent: {formatINR(selectedRow.spent)} · Remaining:{' '}
                {formatINR(Math.max(0, selectedRow.allocated - selectedRow.spent))}
              </p>
            </div>

            {/* Quick Category Selector Pills */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto max-w-full pb-1">
              {rows.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`min-h-7 rounded-full border px-2.5 text-xs font-semibold transition-all ${
                    r.id === selectedRow.id
                      ? 'border-amber-400 bg-gradient-to-r from-purple-950 to-indigo-900 text-amber-200 shadow-2xs dark:from-amber-400 dark:to-yellow-500 dark:text-purple-950 dark:border-transparent'
                      : 'border-amber-200/60 bg-white/90 text-stone-700 hover:bg-purple-50 dark:border-purple-800/40 dark:bg-[#130924] dark:text-stone-300'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {asTable ? (
        <div className="mt-4">
          <TableView rows={rows} />
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <figure>
            <figcaption className="mb-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
              Allocation by category
            </figcaption>
            <div
              className="h-72"
              role="img"
              aria-label="Pie chart of budget allocation. Use “View as table” for exact values."
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={rows}
                    dataKey="allocated"
                    nameKey="name"
                    innerRadius="45%"
                    outerRadius="80%"
                    stroke={surface}
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {rows.map((r, i) => (
                      <Cell key={r.id} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [formatINR(v), name]}
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: ink }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => <span style={{ color: ink }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </figure>
          <figure>
            <figcaption className="mb-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
              Allocated vs spent
            </figcaption>
            <div
              style={{ height: rows.length * 52 + 70 }}
              role="img"
              aria-label="Bar chart comparing allocated and spent amounts per category. Use “View as table” for exact values."
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 12 }} barGap={2}>
                  <CartesianGrid horizontal={false} stroke={grid} />
                  <XAxis
                    type="number"
                    tickFormatter={compactINR}
                    tick={{ fontSize: 11, fill: ink }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={112}
                    tick={{ fontSize: 11, fill: ink }}
                    interval={0}
                  />
                  <Tooltip
                    formatter={(v, name) => [formatINR(v), name]}
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: ink }}
                    cursor={{ fill: grid }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => <span style={{ color: ink }}>{value}</span>}
                  />
                  <Bar
                    dataKey="allocated"
                    name="Allocated"
                    fill={colors[0]}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="spent"
                    name="Spent"
                    fill={colors[1]}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </figure>
        </div>
      )}
    </Card>
  );
}
