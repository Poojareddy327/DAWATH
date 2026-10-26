export default function ProgressBar({ value, label, tone = 'normal' }) {
  const fill = tone === 'danger' ? 'bg-red-700 dark:bg-red-400' : 'bg-amber-500 dark:bg-amber-400';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2.5 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-stone-800"
    >
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${value}%` }} />
    </div>
  );
}
