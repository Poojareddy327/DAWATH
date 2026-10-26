export default function ProgressBar({ value, label, tone = 'normal' }) {
  const fill =
    tone === 'danger'
      ? 'bg-gradient-to-r from-red-600 to-rose-700 dark:from-red-500 dark:to-rose-400'
      : 'bg-gradient-to-r from-emerald-800 via-teal-700 to-amber-500 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2.5 w-full overflow-hidden rounded-full border border-amber-200/50 bg-amber-100/70 shadow-inner dark:border-emerald-900/50 dark:bg-[#06261d]"
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${fill}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
