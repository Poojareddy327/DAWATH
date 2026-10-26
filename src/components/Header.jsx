import { useState } from 'react';
import Garland from './Garland.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Button from './ui/Button.jsx';

export default function Header({ hasEvent, onReset }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <header className="print:hidden">
      <Garland />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          {/* Deccani Royal Arch / Charminar Insignia */}
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/50 bg-gradient-to-br from-emerald-900 to-teal-950 text-xl shadow-sm dark:border-amber-400/40"
          >
            🕌
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl dark:text-amber-300">
                DAWAT
              </span>
              <span className="rounded-md border border-amber-300/80 bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-emerald-950 dark:text-amber-200">
                దావత్
              </span>
            </div>
            <p className="text-xs font-medium text-stone-600 sm:text-sm dark:text-stone-300">
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
