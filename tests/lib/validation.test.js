import { describe, expect, it } from 'vitest';
import {
  validateExpense,
  validateIntake,
  validateTask,
  validateVendor,
} from '../../src/lib/validation.js';
import { TODAY } from '../fixtures/personas.js';

const form = {
  type: 'wedding',
  date: '2027-01-18',
  budget: '800000',
  guests: '300',
  city: 'Kochi',
  culture: 'Kerala',
  prefs: '',
};

describe('validateIntake (PRD FR-1)', () => {
  it('accepts valid form strings and coerces numbers', () => {
    const result = validateIntake(form, TODAY);
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ budget: 800000, guests: 300 });
  });

  it('reports a message per required field when empty', () => {
    const result = validateIntake(
      { type: '', date: '', budget: '', guests: '', city: '', culture: '', prefs: '' },
      TODAY,
    );
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(['budget', 'city', 'date', 'guests', 'type']);
    expect(result.errors.budget).toBe('Enter your budget in ₹');
  });

  it.each([
    ['date', '2026-10-19', /past/],
    ['date', '2028-10-20', /2 years/],
    ['budget', '4999', /at least/],
    ['budget', '50000001', /at most/],
    ['guests', '4', /At least 5/],
    ['guests', '5001', /At most/],
    ['guests', '10.5', /whole/],
    ['city', 'K', /at least 2/],
    ['city', 'x'.repeat(61), /under 60/],
    ['prefs', 'x'.repeat(501), /under 500/],
    ['culture', 'Klingon', /.+/],
    ['type', 'party', /event type/],
  ])('rejects %s = %s', (field, value, message) => {
    const result = validateIntake({ ...form, [field]: value }, TODAY);
    expect(result.ok).toBe(false);
    expect(result.errors[field]).toMatch(message);
  });

  it('accepts the boundaries (today and today + 730 days in IST)', () => {
    expect(validateIntake({ ...form, date: TODAY }, TODAY).ok).toBe(true);
    expect(validateIntake({ ...form, date: '2028-10-19' }, TODAY).ok).toBe(true);
    expect(validateIntake({ ...form, budget: '5000', guests: '5000' }, TODAY).ok).toBe(true);
  });
});

describe('expense / task / vendor forms', () => {
  it('validates expenses', () => {
    const ok = validateExpense({
      categoryId: 'cat-venue',
      label: 'Advance',
      amount: '25000.4',
      date: TODAY,
      note: '',
    });
    expect(ok).toMatchObject({ ok: true, data: { amount: 25000 } });
    const bad = validateExpense({ categoryId: '', label: '', amount: '0', date: 'x', note: '' });
    expect(Object.keys(bad.errors).sort()).toEqual(['amount', 'categoryId', 'date', 'label']);
  });

  it('keeps new tasks inside the days left', () => {
    const values = { title: 'Call DJ', dueDaysBefore: '30', category: 'Music', priority: 'high' };
    expect(validateTask(values, 21).errors.dueDaysBefore).toMatch(/21 or less/);
    expect(validateTask({ ...values, dueDaysBefore: '7' }, 21).ok).toBe(true);
  });

  it('validates custom vendors', () => {
    expect(
      validateVendor({ category: 'Decor', type: 'Florist', estCost: '5000', notes: '' }).ok,
    ).toBe(true);
    expect(validateVendor({ category: '', type: '', estCost: '-1', notes: '' }).ok).toBe(false);
  });
});
