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

// Validated categorical palette (fixed order, light / dark steps).
const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
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
  const dark = useIsDark();
  const colors = dark ? SERIES.dark : SERIES.light;
  const ink = dark ? '#d6d3d1' : '#44403c';
  const grid = dark ? '#292524' : '#f5e9d3';
  const surface = dark ? '#1c1917' : '#ffffff';
  const tooltipStyle = {
    background: surface,
    border: `1px solid ${grid}`,
    borderRadius: 12,
    color: ink,
  };

  return (
    <Card aria-labelledby="charts-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="charts-title" className="text-lg font-semibold text-rose-900 dark:text-amber-300">
          Budget at a glance
        </h3>
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {asTable ? 'View as charts' : 'View as table'}
        </Button>
      </div>

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
              <ResponsiveContainer width="100%" height="100%">
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
              <ResponsiveContainer width="100%" height="100%">
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
