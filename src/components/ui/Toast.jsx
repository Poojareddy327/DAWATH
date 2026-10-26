import { useEffect } from 'react';

const TOAST_MS = 7000;

/** Non-blocking notice. Always mounted so screen readers pick up changes in the live region. */
export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, TOAST_MS);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 print:hidden"
    >
      {message && (
        <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-amber-100 dark:text-stone-950">
          <span aria-hidden="true">🪔</span>
          <p className="flex-1">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 rounded-lg px-2 py-1 font-semibold underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
