import { useState } from 'react';
import { PRIORITIES } from '../lib/constants.js';
import { validateTask } from '../lib/validation.js';
import Button from './ui/Button.jsx';
import Field, { inputClass } from './ui/Field.jsx';

export default function TaskForm({ idPrefix, initial, maxDays, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({
    title: initial?.title ?? '',
    dueDaysBefore: String(initial?.dueDaysBefore ?? Math.min(7, maxDays)),
    category: initial?.category ?? '',
    priority: initial?.priority ?? 'medium',
  }));
  const [errors, setErrors] = useState({});
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const result = validateTask(values, maxDays);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.data);
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      className="mt-4 grid gap-3 sm:grid-cols-2"
      aria-label={initial ? 'Edit task' : 'Add task'}
    >
      <Field id={`${idPrefix}-title`} label="Task" error={errors.title} className="sm:col-span-2">
        {(a11y) => (
          <input
            {...a11y}
            className={inputClass}
            value={values.title}
            onChange={set('title')}
            maxLength={120}
          />
        )}
      </Field>
      <Field
        id={`${idPrefix}-days`}
        label="Days before the event"
        hint={`0 to ${maxDays}`}
        error={errors.dueDaysBefore}
      >
        {(a11y) => (
          <input
            {...a11y}
            type="number"
            inputMode="numeric"
            min="0"
            max={maxDays}
            className={inputClass}
            value={values.dueDaysBefore}
            onChange={set('dueDaysBefore')}
          />
        )}
      </Field>
      <Field id={`${idPrefix}-category`} label="Category" error={errors.category}>
        {(a11y) => (
          <input
            {...a11y}
            className={inputClass}
            value={values.category}
            onChange={set('category')}
            maxLength={60}
            placeholder="e.g. Venue"
          />
        )}
      </Field>
      <Field id={`${idPrefix}-priority`} label="Priority" error={errors.priority}>
        {(a11y) => (
          <select
            {...a11y}
            className={inputClass}
            value={values.priority}
            onChange={set('priority')}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <div className="flex items-end gap-2">
        <Button type="submit">{initial ? 'Save task' : 'Add task'}</Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
