import { useEffect, useRef, useState } from 'react';
import { EVENT_TYPES } from '../lib/constants.js';
import { countdownLabel, daysBetween } from '../lib/dates.js';
import { formatDate, formatINR, formatNumber } from '../lib/format.js';
import { downloadBudgetPdf } from '../lib/pdf.js';
import BudgetTab from './BudgetTab.jsx';
import CelebrationPass from './CelebrationPass.jsx';
import IdeasTab from './IdeasTab.jsx';
import ReadinessScore from './ReadinessScore.jsx';
import Tabs from './Tabs.jsx';
import TimelineTab from './TimelineTab.jsx';
import VendorsTab from './VendorsTab.jsx';
import Button from './ui/Button.jsx';

const TABS = [
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'timeline', label: 'Timeline', icon: '🗓️' },
  { id: 'vendors', label: 'Vendors', icon: '🤝' },
  { id: 'ideas', label: 'Ideas', icon: '💡' },
];

export default function Dashboard({ event, dispatch, today, notify }) {
  const [tab, setTab] = useState('budget');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const headingRef = useRef(null);
  const { meta, plan } = event;
  const typeLabel = EVENT_TYPES.find((t) => t.value === meta.type)?.label ?? meta.type;
  const daysLeft = daysBetween(today, meta.date);

  useEffect(() => {
    headingRef.current?.focus();
  }, [meta.createdAt]);

  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      await downloadBudgetPdf(event);
    } catch {
      notify('Could not create the PDF. Please try again.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 print:hidden">
      <section aria-labelledby="event-title" className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">
              {countdownLabel(daysLeft)}
            </p>
            <h1
              id="event-title"
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50"
            >
              {meta.culture ? `${meta.culture} ` : ''}
              {typeLabel} · {meta.city}
            </h1>
            <p className="mt-1 text-stone-700 dark:text-stone-300">
              {formatDate(meta.date)} · {formatNumber(meta.guests)} guests ·{' '}
              {formatINR(meta.budget)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowPass(true)}>
              💌 Digital Patrika
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              🖨️ Print checklist
            </Button>
            <Button variant="secondary" size="sm" onClick={exportPdf} disabled={pdfBusy}>
              📄 {pdfBusy ? 'Preparing…' : 'Budget PDF'}
            </Button>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-stone-800 dark:text-stone-200">{plan.summary}</p>
        <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
          {plan.source === 'ai'
            ? '✨ Drafted by Gemini · amounts computed by Dawat'
            : '🛟 Smart starter plan (Deccani offline planner) · amounts computed by Dawat'}
        </p>
        {plan.warnings.length > 0 && (
          <ul className="mt-3 space-y-2" aria-label="Plan warnings">
            {plan.warnings.map((w) => (
              <li
                key={w}
                className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
              >
                <span aria-hidden="true">⚠️ </span>
                {w}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReadinessScore event={event} today={today} />

      <Tabs label="Plan sections" tabs={TABS} active={tab} onChange={setTab}>
        {(active) => {
          if (active === 'budget')
            return <BudgetTab event={event} dispatch={dispatch} today={today} />;
          if (active === 'timeline')
            return <TimelineTab event={event} dispatch={dispatch} today={today} />;
          if (active === 'vendors') return <VendorsTab event={event} dispatch={dispatch} />;
          return <IdeasTab event={event} dispatch={dispatch} notify={notify} />;
        }}
      </Tabs>

      {showPass && (
        <CelebrationPass event={event} onClose={() => setShowPass(false)} notify={notify} />
      )}
    </div>
  );
}
