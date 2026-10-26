import { useState } from 'react';
import { VENDOR_STATUS_LABELS, VENDOR_STATUSES } from '../lib/constants.js';
import { buildVendorsCsv, downloadCsvFile } from '../lib/csv.js';
import { formatINR } from '../lib/format.js';
import VendorCard from './VendorCard.jsx';
import VendorForm from './VendorForm.jsx';
import Button from './ui/Button.jsx';

const statusOf = (state, id) => state.vendorStatus[id] ?? 'to-contact';

export default function VendorsTab({ event, dispatch }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const { plan, state } = event;

  const counts = Object.fromEntries(VENDOR_STATUSES.map((s) => [s, 0]));
  for (const v of plan.vendors) counts[statusOf(state, v.id)] += 1;
  const secured = counts.booked + counts.paid;
  const estTotal = plan.vendors.reduce((sum, v) => sum + v.estCost, 0);
  const visible = plan.vendors.filter((v) => {
    if (filter !== 'all' && statusOf(state, v.id) !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        v.type.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.notes && v.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const chips = [
    ['all', 'All', plan.vendors.length],
    ...VENDOR_STATUSES.map((s) => [s, VENDOR_STATUS_LABELS[s], counts[s]]),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50">
            {secured} / {plan.vendors.length} booked
          </h2>
          <p className="text-sm text-stone-700 dark:text-stone-300">
            Estimated vendor spend {formatINR(estTotal)} · booked includes paid
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const csv = buildVendorsCsv(event);
              downloadCsvFile(`dawat-vendors-${event.meta.city.toLowerCase()}.csv`, csv);
            }}
          >
            📥 Export Contacts (CSV)
          </Button>
          <Button onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
            {adding ? 'Close' : '+ Add vendor'}
          </Button>
        </div>
      </div>

      {adding && (
        <VendorForm
          categories={plan.budget.categories}
          onCancel={() => setAdding(false)}
          onSave={(vendor) => {
            dispatch({ type: 'vendor/add', vendor });
            setAdding(false);
          }}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors…"
          aria-label="Search vendors"
          className="min-h-9 w-full sm:w-56 rounded-full border border-amber-300/60 bg-white px-3.5 text-xs text-stone-900 shadow-xs focus:border-purple-800 focus:outline-none dark:border-purple-800/60 dark:bg-[#130924] dark:text-stone-100"
        />
        <div role="group" aria-label="Filter vendors by status" className="flex flex-wrap gap-1.5">
          {chips.map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-9 rounded-full border px-3 text-sm font-semibold transition-all ${
                filter === value
                  ? 'border-amber-400/50 bg-gradient-to-r from-purple-950 to-indigo-900 text-amber-200 shadow-sm dark:border-transparent dark:from-amber-400 dark:to-yellow-500 dark:text-purple-950'
                  : 'border-amber-300/60 bg-white/90 text-stone-800 hover:border-amber-400 hover:bg-purple-50/80 dark:border-purple-800/40 dark:bg-[#130924] dark:text-stone-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">
          {search.trim()
            ? `No vendors match "${search}". Try another search term or filter.`
            : 'No vendors with this status yet.'}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              status={statusOf(state, vendor.id)}
              contact={state.vendorContacts[vendor.id] ?? ''}
              onStatus={(status) => dispatch({ type: 'vendor/setStatus', id: vendor.id, status })}
              onContact={(contact) =>
                dispatch({ type: 'vendor/setContact', id: vendor.id, contact })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
