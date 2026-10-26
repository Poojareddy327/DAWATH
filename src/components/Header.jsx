import { useState } from 'react';
import Garland from './Garland.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Button from './ui/Button.jsx';

export default function Header({ hasEvent, onReset }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <header className="print:hidden border-b border-amber-300/40 bg-white/70 backdrop-blur-md dark:border-emerald-900/50 dark:bg-[#031a14]/80">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-950 via-amber-400 to-teal-900 dark:from-emerald-600 dark:via-amber-400 dark:to-yellow-500" />
      <Garland />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          {/* Deccani Royal Arch / Charminar Insignia */}
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/60 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-2xl shadow-md dark:border-amber-400/50 dark:from-emerald-900 dark:to-teal-950"
          >
            🕌
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl dark:text-amber-300">
                DAWAT
              </span>
              <span className="rounded-lg border border-amber-400/80 bg-amber-50/90 px-2 py-0.5 text-xs font-bold text-amber-950 shadow-xs dark:border-amber-400/40 dark:bg-emerald-950 dark:text-amber-200">
                దావత్
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-600 sm:text-sm dark:text-stone-300">
              Telangana & Hyderabadi AI Celebration Planner
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasEvent &&
            (confirming ? (
              <div
                role="group"
                aria-label="Confirm starting a new plan"
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2 py-1 dark:border-red-900/60 dark:bg-stone-800"
              >
                <span className="text-sm font-medium text-red-900 dark:text-red-200">
                  Clear this plan?
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setConfirming(false);
                    onReset();
                  }}
                >
                  Yes, clear
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
                Start new plan
              </Button>
            ))}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
