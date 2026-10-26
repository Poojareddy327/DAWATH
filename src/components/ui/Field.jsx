export const inputClass =
  'block w-full min-h-11 rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 placeholder:text-stone-500 aria-[invalid=true]:border-red-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-400 dark:aria-[invalid=true]:border-red-400';

/**
 * Label + control + hint/error, wired with aria-describedby / aria-invalid.
 * `children` is a render function receiving the props to spread on the control.
 */
export default function Field({
  id,
  label,
  error,
  hint,
  optional = false,
  className = '',
  children,
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-semibold text-stone-800 dark:text-stone-200"
      >
        {label}
        {optional && (
          <span className="font-normal text-stone-600 dark:text-stone-400"> (optional)</span>
        )}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-stone-600 dark:text-stone-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-red-800 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
