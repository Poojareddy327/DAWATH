export default function Card({ as: Tag = 'section', className = '', ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-amber-300/60 bg-white/95 p-4 shadow-[0_6px_24px_-4px_rgba(6,78,59,0.08)] sm:p-6 backdrop-blur-sm dark:border-emerald-800/40 dark:bg-[#071f18]/95 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${className}`}
      {...props}
    />
  );
}
