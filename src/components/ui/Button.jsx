const VARIANTS = {
  primary:
    'bg-emerald-900 text-white shadow-sm hover:bg-emerald-800 border border-emerald-950/20 dark:bg-amber-400 dark:text-emerald-950 dark:hover:bg-amber-300 dark:border-amber-500/30',
  secondary:
    'border border-emerald-900/30 bg-white text-emerald-900 hover:bg-emerald-50/80 dark:border-amber-300/40 dark:bg-stone-900 dark:text-amber-200 dark:hover:bg-stone-800',
  ghost: 'text-emerald-900 hover:bg-emerald-50 dark:text-amber-200 dark:hover:bg-stone-800',
  danger:
    'border border-red-700/40 bg-white text-red-800 hover:bg-red-50 dark:border-red-400/50 dark:bg-stone-900 dark:text-red-300 dark:hover:bg-stone-800',
};

const SIZES = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
