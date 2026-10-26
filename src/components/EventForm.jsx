import { useRef, useState } from 'react';
import { CULTURES, EVENT_TYPES, LIMITS } from '../lib/constants.js';
import { addDays } from '../lib/dates.js';
import { PERSONAS, personaIntake } from '../lib/samples.js';
import { validateIntake } from '../lib/validation.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import Field, { inputClass } from './ui/Field.jsx';

const EMPTY = { type: '', date: '', budget: '', guests: '', city: '', culture: '', prefs: '' };
const FIELD_ORDER = ['type', 'date', 'budget', 'guests', 'city', 'culture', 'prefs'];

export default function EventForm({ today, onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors(({ [name]: _gone, ...rest }) => rest);
  };

  const submit = (vals) => {
    const result = validateIntake(vals, today);
    if (!result.ok) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((f) => result.errors[f]);
      formRef.current?.querySelector(`#intake-${first}`)?.focus();
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  const trySample = (persona) => {
    const sample = Object.fromEntries(
      Object.entries(personaIntake(persona, today)).map(([k, v]) => [k, String(v)]),
    );
    setValues(sample);
    submit(sample);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-emerald-950 sm:text-4xl dark:text-stone-50">
          Plan your Hyderabadi & Telangana Celebration
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-stone-700 dark:text-stone-300">
          From grand Telugu Pellillu to regal Nizami Dawats: Dawat drafts your budget, countdown
          timeline, vendor checklist and personalized ideas in seconds.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-emerald-950 dark:text-amber-300">
          Try a sample celebration
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Instant plan demonstration with real Telangana & Hyderabadi families.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERSONAS.map((p) => (
            <Button key={p.id} variant="secondary" size="sm" onClick={() => trySample(p)}>
              {p.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <form
          ref={formRef}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(values);
          }}
          aria-labelledby="intake-title"
        >
          <h2 id="intake-title" className="text-lg font-semibold text-rose-900 dark:text-amber-300">
            Tell us about your event
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field id="intake-type" label="Event type" error={errors.type}>
              {(a11y) => (
                <select
                  {...a11y}
                  className={inputClass}
                  value={values.type}
                  onChange={set('type')}
                  required
                >
                  <option value="">Choose…</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field id="intake-date" label="Event date" error={errors.date}>
              {(a11y) => (
                <input
                  {...a11y}
                  type="date"
                  className={inputClass}
                  value={values.date}
                  min={today}
                  max={addDays(today, LIMITS.maxDaysAhead)}
                  onChange={set('date')}
                  required
                />
              )}
            </Field>

            <Field
              id="intake-budget"
              label="Total budget (₹)"
              hint="₹5,000 to ₹5,00,00,000"
              error={errors.budget}
            >
              {(a11y) => (
                <input
                  {...a11y}
                  type="number"
                  inputMode="numeric"
                  min={LIMITS.budgetMin}
                  max={LIMITS.budgetMax}
                  step="1000"
                  className={inputClass}
                  value={values.budget}
                  onChange={set('budget')}
                  placeholder="e.g. 800000"
                  required
                />
              )}
            </Field>

            <Field
              id="intake-guests"
              label="Number of guests"
              hint="5 to 5,000"
              error={errors.guests}
            >
              {(a11y) => (
                <input
                  {...a11y}
                  type="number"
                  inputMode="numeric"
                  min={LIMITS.guestsMin}
                  max={LIMITS.guestsMax}
                  className={inputClass}
                  value={values.guests}
                  onChange={set('guests')}
                  placeholder="e.g. 300"
                  required
                />
              )}
            </Field>

            <Field id="intake-city" label="City" error={errors.city}>
              {(a11y) => (
                <input
                  {...a11y}
                  type="text"
                  autoComplete="address-level2"
                  maxLength={LIMITS.cityMax}
                  className={inputClass}
                  value={values.city}
                  onChange={set('city')}
                  placeholder="e.g. Hyderabad"
                  required
                />
              )}
            </Field>

            <Field id="intake-culture" label="Culture / region" optional error={errors.culture}>
              {(a11y) => (
                <select
                  {...a11y}
                  className={inputClass}
                  value={values.culture}
                  onChange={set('culture')}
                >
                  <option value="">Not specified</option>
                  {CULTURES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field
              id="intake-prefs"
              label="Preferences"
              optional
              hint={`Diet, eco-friendly, indoor/outdoor, theme hints · ${values.prefs.length}/${LIMITS.prefsMax}`}
              error={errors.prefs}
              className="sm:col-span-2"
            >
              {(a11y) => (
                <textarea
                  {...a11y}
                  rows={3}
                  maxLength={LIMITS.prefsMax}
                  className={inputClass}
                  value={values.prefs}
                  onChange={set('prefs')}
                  placeholder="e.g. Traditional Telugu Jeelakarra Bellam, Hyderabadi Dum Biryani, Kompally indoor AC hall, Marfa band"
                />
              )}
            </Field>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
            Create my plan
          </Button>
        </form>
      </Card>
    </div>
  );
}
