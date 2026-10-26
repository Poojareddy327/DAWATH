const VARIANTS = {
  primary:
    'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-amber-100 shadow-md border border-amber-400/40 hover:from-emerald-900 hover:to-teal-900 hover:border-amber-400/70 hover:shadow-emerald-950/25 active:scale-[0.99] dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 dark:text-emerald-950 dark:hover:from-amber-300 dark:hover:to-yellow-300 dark:border-amber-200/50',
  secondary:
    'border border-emerald-950/20 bg-white/90 backdrop-blur-sm text-emerald-950 shadow-sm hover:border-amber-500/60 hover:bg-amber-50/70 active:scale-[0.99] dark:border-amber-400/30 dark:bg-emerald-950/40 dark:text-amber-200 dark:hover:bg-emerald-900/50',
  ghost:
    'text-emerald-950 hover:bg-emerald-100/60 active:scale-[0.99] dark:text-amber-200 dark:hover:bg-emerald-950/60',
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
