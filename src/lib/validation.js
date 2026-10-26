// Form validation: Zod schemas → { ok, data } or { ok: false, errors: { field: message } }.
import { z } from 'zod';
import { LIMITS, PRIORITIES } from './constants.js';
import { isISODate } from './dates.js';
import { makeIntakeSchema } from './schema.js';

function toResult(parsed) {
  if (parsed.success) return { ok: true, data: parsed.data, errors: {} };
  const errors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] ?? 'form';
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}

const blankToUndefined = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const amount = (label) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: `Enter the ${label}` })
      .min(0, `${label[0].toUpperCase()}${label.slice(1)} can’t be negative`)
      .max(LIMITS.budgetMax, 'That amount is too large'),
  );

export function validateIntake(values, today) {
  return toResult(makeIntakeSchema(today).safeParse(values));
}

const ExpenseInput = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  label: z.string().trim().min(1, 'Describe the expense').max(80, 'Keep it under 80 characters'),
  amount: amount('amount').refine((n) => n > 0, 'Amount must be more than ₹0'),
  date: z.string().refine(isISODate, 'Pick a valid date'),
  note: z.string().trim().max(200, 'Keep the note under 200 characters').default(''),
});

export function validateExpense(values) {
  const result = toResult(ExpenseInput.safeParse(values));
  if (result.ok) result.data.amount = Math.round(result.data.amount);
  return result;
}

export function makeTaskInput(daysLeft) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Give the task a title')
      .max(120, 'Keep it under 120 characters'),
    dueDaysBefore: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ error: 'Enter days before the event' })
        .int('Use a whole number of days')
        .min(0, 'Can’t be negative')
        .max(daysLeft, `Must be ${daysLeft} or less (days left until the event)`),
    ),
    category: z.string().trim().min(1, 'Add a category').max(60, 'Keep it under 60 characters'),
    priority: z.enum(PRIORITIES),
  });
}

export function validateTask(values, daysLeft) {
  return toResult(makeTaskInput(daysLeft).safeParse(values));
}

const VendorInput = z.object({
  category: z.string().trim().min(1, 'Add a category').max(60, 'Keep it under 60 characters'),
  type: z.string().trim().min(1, 'What kind of vendor?').max(80, 'Keep it under 80 characters'),
  estCost: amount('estimated cost'),
  notes: z.string().trim().max(300, 'Keep notes under 300 characters').default(''),
});

export function validateVendor(values) {
  return toResult(VendorInput.safeParse(values));
}
