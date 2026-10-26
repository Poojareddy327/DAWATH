const VARIANTS = {
  primary:
    'bg-rose-900 text-white shadow-sm hover:bg-rose-800 dark:bg-amber-400 dark:text-stone-950 dark:hover:bg-amber-300',
  secondary:
    'border border-rose-900/30 bg-white text-rose-900 hover:bg-rose-50 dark:border-amber-300/40 dark:bg-stone-900 dark:text-amber-200 dark:hover:bg-stone-800',
  ghost: 'text-rose-900 hover:bg-rose-50 dark:text-amber-200 dark:hover:bg-stone-800',
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
