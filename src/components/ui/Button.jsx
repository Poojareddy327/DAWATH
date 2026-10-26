const VARIANTS = {
  primary:
    'bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-amber-200 shadow-md border border-amber-400/50 hover:from-purple-900 hover:to-indigo-900 hover:border-amber-400/80 hover:shadow-purple-950/30 active:scale-[0.99] dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 dark:text-purple-950 dark:hover:from-amber-300 dark:hover:to-yellow-300 dark:border-amber-200/50',
  secondary:
    'border border-purple-950/20 bg-white/90 backdrop-blur-sm text-purple-950 shadow-sm hover:border-amber-500/70 hover:bg-purple-50/70 active:scale-[0.99] dark:border-purple-400/30 dark:bg-purple-950/40 dark:text-amber-200 dark:hover:bg-purple-900/50',
  ghost:
    'text-purple-950 hover:bg-purple-100/60 active:scale-[0.99] dark:text-amber-200 dark:hover:bg-purple-950/60',
  danger:
    'border border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200',
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
