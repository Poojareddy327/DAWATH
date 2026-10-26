import { describe, expect, it } from 'vitest';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { dedupeIds, slugify, uniqueId } from '../../src/lib/ids.js';
import { daysLeftUntil, finalizePlan, fitTasks } from '../../src/lib/postprocess.js';
import { ARJUN, TODAY } from '../fixtures/personas.js';

describe('fitTasks', () => {
  const tasks = [
    { id: 'a', dueDaysBefore: 40 },
    { id: 'b', dueDaysBefore: 21 },
    { id: 'c', dueDaysBefore: 7.6 },
    { id: 'd', dueDaysBefore: -3 },
  ];

  it('drops tasks due before today, rounds and clamps the rest, assigns phases', () => {
    expect(fitTasks(tasks, 21)).toEqual([
      { id: 'b', dueDaysBefore: 21, phase: 'final-month' },
      { id: 'c', dueDaysBefore: 8, phase: 'final-month' },
      { id: 'd', dueDaysBefore: 0, phase: 'day-of' },
    ]);
  });
});

describe('finalizePlan', () => {
  const raw = buildFallbackPlan(ARJUN, TODAY);

  it('normalizes model percents and keeps the source', () => {
    const skewed = {
      ...raw,
      budget: {
        categories: raw.budget.categories.map((c) => ({ ...c, percent: c.percent * 1.37 })),
      },
    };
    const plan = finalizePlan(skewed, ARJUN, TODAY, 'ai');
    expect(plan.budget.categories.reduce((a, c) => a + c.percent, 0)).toBe(100);
    expect(plan.source).toBe('ai');
  });

  it('de-duplicates ids', () => {
    const dupes = { ...raw, vendors: [raw.vendors[0], raw.vendors[0], ...raw.vendors.slice(1)] };
    const ids = finalizePlan(dupes, ARJUN, TODAY, 'ai').vendors.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never returns negative days left', () => {
    expect(daysLeftUntil('2026-10-01', TODAY)).toBe(0);
    expect(daysLeftUntil('2026-11-10', TODAY)).toBe(21);
  });
});

describe('ids', () => {
  it('slugifies to lowercase kebab', () => {
    expect(slugify('Book the Venue!')).toBe('book-the-venue');
    expect(slugify('***')).toBe('item');
  });

  it('finds the next free id', () => {
    expect(uniqueId('a', new Set(['a', 'a-2']))).toBe('a-3');
  });

  it('keeps first occurrences and renames duplicates', () => {
    expect(dedupeIds([{ id: 'x' }, { id: 'x' }, { id: 'Y Z' }]).map((i) => i.id)).toEqual([
      'x',
      'x-2',
      'y-z',
    ]);
  });
});
