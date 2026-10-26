import { useEffect, useState } from 'react';

const STEPS = [
  'Splitting your budget…',
  'Building timeline…',
  'Finding vendors…',
  'Gathering ideas…',
];
const STEP_MS = 1800;

export default function LoadingPlan() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16" aria-busy="true">
      <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50">
        Drafting your plan
      </h1>
      <p role="status" aria-live="polite" className="mt-1 text-stone-700 dark:text-stone-300">
        {STEPS[step]}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="skeleton rounded-2xl border border-amber-200/70 bg-white/80 p-5 dark:border-stone-800 dark:bg-stone-900"
          >
            <div className="h-4 w-1/2 rounded bg-amber-100 dark:bg-stone-800" />
            <div className="mt-4 h-3 w-full rounded bg-amber-50 dark:bg-stone-800" />
            <div className="mt-2 h-3 w-5/6 rounded bg-amber-50 dark:bg-stone-800" />
            <div className="mt-2 h-3 w-2/3 rounded bg-amber-50 dark:bg-stone-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
