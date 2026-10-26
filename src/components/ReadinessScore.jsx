import { daysBetween, dueDate } from '../lib/dates.js';
import { formatINR } from '../lib/format.js';

export default function ReadinessScore({ event, today }) {
  const { meta, plan, state, expenses } = event;
  const totalTasks = plan.tasks.length;
  const doneTasks = plan.tasks.filter((t) => state.doneTaskIds.includes(t.id)).length;
  const taskPct = totalTasks > 0 ? (doneTasks / totalTasks) * 35 : 0;

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = meta.budget - totalSpent;
  const budgetPct =
    remaining >= 0 ? 35 : Math.max(0, 35 - ((totalSpent - meta.budget) / meta.budget) * 35);

  const totalVendors = plan.vendors.length;
  const bookedVendors = plan.vendors.filter((v) => {
    const s = state.vendorStatus[v.id];
    return s === 'booked' || s === 'paid';
  }).length;
  const vendorPct = totalVendors > 0 ? (bookedVendors / totalVendors) * 30 : 0;

  const overallScore = Math.min(100, Math.round(taskPct + budgetPct + vendorPct));

  // Find next pending milestone
  const pendingTasks = plan.tasks
    .filter((t) => !state.doneTaskIds.includes(t.id))
    .sort((a, b) => b.dueDaysBefore - a.dueDaysBefore);
  const nextTask = pendingTasks[0];

  return (
    <section
      aria-label="Celebration Readiness Score"
      className="mb-6 overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-br from-white via-purple-50/40 to-amber-50/30 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-purple-800/40 dark:from-[#150a2b] dark:via-[#110724] dark:to-[#170a30]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Radial score ring */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-purple-950 to-indigo-950 text-amber-200 shadow-md dark:border-amber-400/60">
            <div className="text-center">
              <span className="font-display text-xl font-bold leading-none">{overallScore}%</span>
              <span className="block text-[9px] font-semibold tracking-wider text-amber-300/90 uppercase">
                Ready
              </span>
            </div>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-purple-950 sm:text-xl dark:text-amber-300">
              Celebration Readiness
            </h2>
            <p className="text-xs text-stone-600 sm:text-sm dark:text-stone-300">
              {overallScore >= 80
                ? '🌟 Shandaar! Your celebration is nearly fully coordinated.'
                : overallScore >= 50
                  ? '✨ Great progress! Lock in your high-priority vendors next.'
                  : '🌿 Starter phase: review your budget matrix and milestone timeline.'}
            </p>
          </div>
        </div>

        {/* Quick status chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-amber-300/80 bg-amber-50/90 px-3 py-1 text-amber-950 shadow-2xs dark:border-amber-400/30 dark:bg-purple-950/60 dark:text-amber-200">
            💰 {remaining >= 0 ? `₹${formatINR(remaining).replace('₹', '')} Safe` : 'Over Budget'}
          </span>
          <span className="rounded-full border border-purple-200 bg-purple-50/90 px-3 py-1 text-purple-950 shadow-2xs dark:border-purple-800/40 dark:bg-purple-950/60 dark:text-purple-200">
            🗓️ {doneTasks}/{totalTasks} Done
          </span>
          <span className="rounded-full border border-cyan-200 bg-cyan-50/90 px-3 py-1 text-cyan-950 shadow-2xs dark:border-cyan-800/40 dark:bg-cyan-950/40 dark:text-cyan-200">
            🤝 {bookedVendors}/{totalVendors} Booked
          </span>
        </div>
      </div>

      {nextTask && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200/60 bg-white/80 px-3 py-2 text-xs text-stone-700 dark:border-purple-800/40 dark:bg-[#100722]/80 dark:text-stone-300">
          <span className="font-semibold text-purple-900 dark:text-amber-300">Next Priority:</span>
          <span className="font-medium text-stone-900 dark:text-stone-100">{nextTask.title}</span>
          <span className="ml-auto rounded-md bg-amber-100/80 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-purple-900/60 dark:text-amber-200">
            Due {daysBetween(today, dueDate(meta.date, nextTask.dueDaysBefore))}d before event
          </span>
        </div>
      )}
    </section>
  );
}
