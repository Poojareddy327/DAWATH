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
        <div>
          <p className="font-display text-2xl font-bold text-rose-900 sm:text-3xl dark:text-amber-300">
            Utsav
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-300">Your AI celebration planner</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasEvent &&
            (confirming ? (
              <div
                role="group"
                aria-label="Confirm starting a new plan"
                className="flex items-center gap-2 rounded-xl bg-red-50 px-2 py-1 dark:bg-stone-800"
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
