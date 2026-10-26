export default function Card({ as: Tag = 'section', className = '', ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-amber-300/60 bg-white/95 p-4 shadow-[0_8px_30px_-6px_rgba(76,29,149,0.08)] sm:p-6 backdrop-blur-sm dark:border-purple-800/40 dark:bg-[#130924]/95 dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${className}`}
      {...props}
    />
  );
}
