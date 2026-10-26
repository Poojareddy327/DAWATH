import { useState } from 'react';
import { formatINR } from '../lib/format.js';
import ProgressBar from './ui/ProgressBar.jsx';

/** One budget category with an editable share. Commits on blur or Enter. */
export default function CategoryRow({ row, progress, onPercent }) {
  const [draft, setDraft] = useState(String(row.percent));
  const inputId = `share-${row.id}`;

  const commit = () => {
    const value = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(value)) {
      setDraft(String(row.percent));
      return;
    }
    if (Math.round(value) !== row.percent) onPercent(value);
  };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900 dark:text-stone-100">{row.name}</p>
          {row.notes && <p className="text-sm text-stone-600 dark:text-stone-400">{row.notes}</p>}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="text-sm text-stone-700 dark:text-stone-300">
            <span className="sr-only">{row.name} </span>Share %
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min="0"
            max="100"
            step="1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            className="min-h-11 w-20 rounded-xl border border-stone-300 bg-white px-2 text-right text-base dark:border-stone-600 dark:bg-stone-950"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-sm text-stone-700 dark:text-stone-300">
        <span>Allocated {formatINR(row.allocated)}</span>
        <span className={row.overspent ? 'font-semibold text-red-800 dark:text-red-300' : ''}>
          Spent {formatINR(row.spent)}
          {row.overspent && ' · over budget'}
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar
          value={progress}
          label={`${row.name}: ${progress}% of allocation spent`}
          tone={row.overspent ? 'danger' : 'normal'}
        />
      </div>
    </li>
  );
}
