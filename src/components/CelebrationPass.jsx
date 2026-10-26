import { useState } from 'react';
import { formatDate, formatNumber } from '../lib/format.js';
import Button from './ui/Button.jsx';

export default function CelebrationPass({ event, onClose, notify }) {
  const [copied, setCopied] = useState(false);
  const { meta, plan } = event;

  const invitationText = `✨ Sree / Adaab! You are cordially invited to celebrate:
🎉 ${meta.culture ? `${meta.culture} ` : ''}${meta.type.toUpperCase()} · ${meta.city}
📅 Date: ${formatDate(meta.date)}
👥 Guests: ${formatNumber(meta.guests)}
📍 City: ${meta.city}
✨ Highlights: ${plan.summary.slice(0, 150)}…
🙏 Hosted with joy & Deccani hospitality!`;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(invitationText);
      setCopied(true);
      notify?.('Invitation text copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify?.('Please select and copy the invitation text.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pass-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#faf5ff] via-white to-[#fffbeb] p-6 shadow-2xl dark:border-amber-400/60 dark:from-[#1e0d38] dark:via-[#130826] dark:to-[#170a30]">
        {/* Top Gold Corner Ornaments */}
        <div className="absolute top-2 left-2 text-amber-500 text-xs">✦</div>
        <div className="absolute top-2 right-2 text-amber-500 text-xs">✦</div>
        <div className="absolute bottom-2 left-2 text-amber-500 text-xs">✦</div>
        <div className="absolute bottom-2 right-2 text-amber-500 text-xs">✦</div>

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/60 bg-gradient-to-br from-purple-950 to-indigo-950 text-2xl shadow-md">
            💌
          </div>
          <span className="mt-2 inline-block rounded-full border border-amber-400/80 bg-amber-100/90 px-3 py-0.5 text-xs font-bold text-amber-950 dark:border-amber-400/40 dark:bg-purple-950 dark:text-amber-200">
            శుభలేఖ · DAWAT-E-KHAAS
          </span>
          <h2
            id="pass-title"
            className="mt-2 font-display text-2xl font-bold text-purple-950 dark:text-amber-200"
          >
            Digital Celebration Patrika
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Shareable royal celebration invitation card
          </p>
        </div>

        {/* Card Body with Ornate Frame */}
        <div className="mt-5 rounded-2xl border border-amber-300/80 bg-white/90 p-5 text-center shadow-inner dark:border-purple-800/60 dark:bg-[#0f0620]/90">
          <p className="font-display text-xl font-bold text-purple-950 dark:text-amber-300">
            {meta.culture ? `${meta.culture} ` : ''}Celebration
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-400">
            {formatDate(meta.date)} · {meta.city}
          </p>
          <div className="my-3 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent dark:via-purple-700" />
          <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
            {plan.summary}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200">
              👥 {formatNumber(meta.guests)} Honored Guests
            </span>
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              📍 {meta.city}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            🖨️ Print Card
          </Button>
          <Button size="sm" onClick={copyText}>
            {copied ? '✓ Copied Text' : '📋 Copy Invitation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
