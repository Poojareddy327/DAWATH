import { useState } from 'react';
import { VENDOR_STATUS_LABELS, VENDOR_STATUSES } from '../lib/constants.js';
import { formatINR } from '../lib/format.js';
import { inputClass } from './ui/Field.jsx';

const STATUS_STYLE = {
  'to-contact': 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
  quoted: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  booked: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  paid: 'bg-rose-900 text-white dark:bg-amber-400 dark:text-stone-950',
};

export default function VendorCard({ vendor, status, contact, onStatus, onContact }) {
  const [draft, setDraft] = useState(contact);
  const base = `vendor-${vendor.id}`;

  return (
    <li className="flex flex-col rounded-2xl border border-amber-200/70 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100">
          {vendor.type}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
        >
          {VENDOR_STATUS_LABELS[status]}
        </span>
      </div>
      <p className="mt-1 text-xs">
        <span className="rounded-full bg-cream px-2 py-0.5 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
          {vendor.category}
        </span>
        {vendor.priority === 'must-have' && (
          <span className="ml-2 font-semibold text-rose-900 dark:text-amber-300">Must-have</span>
        )}
      </p>
      <p className="mt-2 font-semibold text-stone-900 dark:text-stone-100">
        Est. {formatINR(vendor.estCost)}
      </p>
      {vendor.notes && (
        <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{vendor.notes}</p>
      )}
      <div className="mt-auto grid gap-2 pt-3">
        <div>
          <label
            htmlFor={`${base}-contact`}
            className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300"
          >
            Contact
          </label>
          <input
            id={`${base}-contact`}
            className={inputClass}
            value={draft}
            maxLength={120}
            placeholder="Name / phone"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft !== contact && onContact(draft.trim())}
          />
        </div>
        <div>
          <label
            htmlFor={`${base}-status`}
            className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-300"
          >
            Status
          </label>
          <select
            id={`${base}-status`}
            className={inputClass}
            value={status}
            onChange={(e) => onStatus(e.target.value)}
          >
            {VENDOR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VENDOR_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </li>
  );
}
