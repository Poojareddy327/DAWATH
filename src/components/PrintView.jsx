import { budgetBreakdown } from '../lib/budget.js';
import { EVENT_TYPES, PHASES, VENDOR_STATUS_LABELS } from '../lib/constants.js';
import { countdownLabel, daysBetween, dueDate, groupTasksByPhase } from '../lib/dates.js';
import { formatDate, formatINR } from '../lib/format.js';

/** Print-only checklist, timeline and vendors (PRD FR-8). Hidden on screen. */
export default function PrintView({ event, today }) {
  const { meta, plan, state, expenses } = event;
  const done = new Set(state.doneTaskIds);
  const groups = groupTasksByPhase(plan.tasks);
  const type = EVENT_TYPES.find((t) => t.value === meta.type)?.label ?? meta.type;

  return (
    <div className="hidden text-sm text-black print:block">
      <h1 className="text-2xl font-bold">
        Utsav plan — {type} in {meta.city}
      </h1>
      <p>
        {formatDate(meta.date)} · {meta.guests} guests · {formatINR(meta.budget)} ·{' '}
        {countdownLabel(daysBetween(today, meta.date))}
      </p>

      <h2 className="mt-6 text-lg font-bold">Checklist &amp; timeline</h2>
      {PHASES.map((phase) =>
        groups[phase.key].length === 0 ? null : (
          <section key={phase.key} className="mt-3 break-inside-avoid">
            <h3 className="font-bold">{phase.label}</h3>
            <ul>
              {groups[phase.key].map((t) => (
                <li key={t.id}>
                  {done.has(t.id) ? '☑' : '☐'} {t.title} — due{' '}
                  {formatDate(dueDate(meta.date, t.dueDaysBefore))} ({t.priority})
                </li>
              ))}
            </ul>
          </section>
        ),
      )}

      <h2 className="mt-6 text-lg font-bold">Vendors</h2>
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="border-b py-1">Vendor</th>
            <th className="border-b py-1">Category</th>
            <th className="border-b py-1">Est. cost</th>
            <th className="border-b py-1">Contact</th>
            <th className="border-b py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {plan.vendors.map((v) => (
            <tr key={v.id}>
              <td className="py-1">{v.type}</td>
              <td className="py-1">{v.category}</td>
              <td className="py-1">{formatINR(v.estCost)}</td>
              <td className="py-1">{state.vendorContacts[v.id] ?? ''}</td>
              <td className="py-1">
                {VENDOR_STATUS_LABELS[state.vendorStatus[v.id] ?? 'to-contact']}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 text-lg font-bold">Budget</h2>
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="border-b py-1">Category</th>
            <th className="border-b py-1">Share</th>
            <th className="border-b py-1">Allocated</th>
            <th className="border-b py-1">Spent</th>
          </tr>
        </thead>
        <tbody>
          {budgetBreakdown(meta.budget, plan.budget.categories, expenses).map((r) => (
            <tr key={r.id}>
              <td className="py-1">{r.name}</td>
              <td className="py-1">{r.percent}%</td>
              <td className="py-1">{formatINR(r.allocated)}</td>
              <td className="py-1">{formatINR(r.spent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
