import { useState } from 'react';
import { VENDOR_STATUS_LABELS, VENDOR_STATUSES } from '../lib/constants.js';
import { formatINR } from '../lib/format.js';
import VendorCard from './VendorCard.jsx';
import VendorForm from './VendorForm.jsx';
import Button from './ui/Button.jsx';

const statusOf = (state, id) => state.vendorStatus[id] ?? 'to-contact';

export default function VendorsTab({ event, dispatch }) {
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const { plan, state } = event;

  const counts = Object.fromEntries(VENDOR_STATUSES.map((s) => [s, 0]));
  for (const v of plan.vendors) counts[statusOf(state, v.id)] += 1;
  const secured = counts.booked + counts.paid;
  const estTotal = plan.vendors.reduce((sum, v) => sum + v.estCost, 0);
  const visible = plan.vendors.filter((v) => filter === 'all' || statusOf(state, v.id) === filter);

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
        <Button onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
          {adding ? 'Close' : '+ Add vendor'}
        </Button>
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

      <div role="group" aria-label="Filter vendors by status" className="flex flex-wrap gap-2">
        {chips.map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${
              filter === value
                ? 'border-rose-900 bg-rose-900 text-white dark:border-amber-400 dark:bg-amber-400 dark:text-stone-950'
                : 'border-stone-300 bg-white text-stone-800 hover:bg-amber-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">No vendors with this status yet.</p>
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
