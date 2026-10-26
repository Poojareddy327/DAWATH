export default function Card({ as: Tag = 'section', className = '', ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-amber-200/80 bg-white/95 p-4 shadow-[0_4px_20px_-4px_rgba(6,78,59,0.08)] sm:p-6 dark:border-emerald-950/80 dark:bg-stone-900/95 dark:shadow-none ${className}`}
      {...props}
    />
  );
}
