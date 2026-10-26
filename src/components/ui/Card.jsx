export default function Card({ as: Tag = 'section', className = '', ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-[0_2px_12px_-4px_rgba(136,19,55,0.12)] sm:p-6 dark:border-stone-800 dark:bg-stone-900 ${className}`}
      {...props}
    />
  );
}
