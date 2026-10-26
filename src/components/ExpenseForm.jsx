import { useState } from 'react';
import { validateExpense } from '../lib/validation.js';
import Button from './ui/Button.jsx';
import Field, { inputClass } from './ui/Field.jsx';

export default function ExpenseForm({ categories, today, initial, onSave, onCancel }) {
  const [values, setValues] = useState(() =>
    initial
      ? { ...initial, amount: String(initial.amount) }
      : { categoryId: categories[0]?.id ?? '', label: '', amount: '', date: today, note: '' },
  );
  const [errors, setErrors] = useState({});
  const prefix = initial ? `edit-${initial.id}` : 'expense';

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const result = validateExpense(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSave(result.data);
    if (!initial) setValues((v) => ({ ...v, label: '', amount: '', note: '' }));
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      aria-label={initial ? 'Edit expense' : 'Add expense'}
    >
      <Field id={`${prefix}-category`} label="Category" error={errors.categoryId}>
        {(a11y) => (
          <select
            {...a11y}
            className={inputClass}
            value={values.categoryId}
            onChange={set('categoryId')}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field id={`${prefix}-label`} label="What for" error={errors.label}>
        {(a11y) => (
          <input
            {...a11y}
            className={inputClass}
            value={values.label}
            onChange={set('label')}
            maxLength={80}
            placeholder="e.g. Hall advance"
          />
        )}
      </Field>
      <Field id={`${prefix}-amount`} label="Amount (₹)" error={errors.amount}>
        {(a11y) => (
          <input
            {...a11y}
            type="number"
            inputMode="numeric"
            min="1"
            className={inputClass}
            value={values.amount}
            onChange={set('amount')}
          />
        )}
      </Field>
      <Field id={`${prefix}-date`} label="Date" error={errors.date}>
        {(a11y) => (
          <input
            {...a11y}
            type="date"
            className={inputClass}
            value={values.date}
            onChange={set('date')}
          />
        )}
      </Field>
      <Field id={`${prefix}-note`} label="Note" optional error={errors.note}>
        {(a11y) => (
          <input
            {...a11y}
            className={inputClass}
            value={values.note}
            onChange={set('note')}
            maxLength={200}
          />
        )}
      </Field>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit">{initial ? 'Save expense' : 'Add expense'}</Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
