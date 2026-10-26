import { useState } from 'react';
import { validateVendor } from '../lib/validation.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Field, { inputClass } from './ui/Field.jsx';

export default function VendorForm({ categories, onSave, onCancel }) {
  const [values, setValues] = useState({
    category: categories[0]?.name ?? '',
    type: '',
    estCost: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const result = validateVendor(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.data);
  };

  return (
    <Card as="div">
      <form
        noValidate
        onSubmit={submit}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Add vendor"
      >
        <Field id="vendor-new-type" label="Vendor type" error={errors.type}>
          {(a11y) => (
            <input
              {...a11y}
              className={inputClass}
              value={values.type}
              onChange={set('type')}
              maxLength={80}
              placeholder="e.g. Mehendi artist"
            />
          )}
        </Field>
        <Field id="vendor-new-category" label="Budget category" error={errors.category}>
          {(a11y) => (
            <select
              {...a11y}
              className={inputClass}
              value={values.category}
              onChange={set('category')}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="vendor-new-cost" label="Estimated cost (₹)" error={errors.estCost}>
          {(a11y) => (
            <input
              {...a11y}
              type="number"
              inputMode="numeric"
              min="0"
              className={inputClass}
              value={values.estCost}
              onChange={set('estCost')}
            />
          )}
        </Field>
        <Field id="vendor-new-notes" label="Notes" optional error={errors.notes}>
          {(a11y) => (
            <input
              {...a11y}
              className={inputClass}
              value={values.notes}
              onChange={set('notes')}
              maxLength={300}
            />
          )}
        </Field>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">Add vendor</Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
