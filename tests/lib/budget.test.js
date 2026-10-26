import { describe, expect, it } from 'vitest';
import {
  apportion,
  budgetBreakdown,
  budgetTotals,
  categoryAmount,
  normalizePercents,
  progressPercent,
  rebalancePercents,
} from '../../src/lib/budget.js';

const sum = (cats) => cats.reduce((a, c) => a + c.percent, 0);
const cats = (...percents) => percents.map((percent, i) => ({ id: `c${i}`, percent }));

describe('normalizePercents', () => {
  it('scales any total to exactly 100 with integers', () => {
    const result = normalizePercents(cats(30, 30, 30));
    expect(sum(result)).toBe(100);
    expect(result.map((c) => c.percent)).toEqual([34, 33, 33]);
  });

  it('handles decimals and over-100 totals', () => {
    expect(sum(normalizePercents(cats(12.5, 40.2, 60, 7.3)))).toBe(100);
  });

  it('splits evenly when every percent is zero or invalid', () => {
    expect(normalizePercents(cats(0, -5, NaN, 0)).map((c) => c.percent)).toEqual([25, 25, 25, 25]);
  });
});

describe('rebalancePercents', () => {
  it('keeps the total at 100 and scales others proportionally', () => {
    const result = rebalancePercents(cats(50, 30, 20), 'c0', 60);
    expect(result.map((c) => c.percent)).toEqual([60, 24, 16]);
    expect(sum(result)).toBe(100);
  });

  it('clamps the edited value to 0–100', () => {
    expect(rebalancePercents(cats(50, 50), 'c0', 150).map((c) => c.percent)).toEqual([100, 0]);
    expect(rebalancePercents(cats(50, 50), 'c0', -10).map((c) => c.percent)).toEqual([0, 100]);
  });

  it('spreads the remainder evenly if the others were all zero', () => {
    expect(rebalancePercents(cats(100, 0, 0), 'c0', 40).map((c) => c.percent)).toEqual([
      40, 30, 30,
    ]);
  });

  it('ignores unknown ids', () => {
    const input = cats(50, 50);
    expect(rebalancePercents(input, 'nope', 10)).toBe(input);
  });
});

describe('amounts and totals', () => {
  it('computes ₹ amounts from percents', () => {
    expect(categoryAmount(800000, 25)).toBe(200000);
    expect(categoryAmount(40000, 7)).toBe(2800);
  });

  it('apportions integers that sum exactly', () => {
    expect(apportion([1, 1, 1], 10)).toEqual([4, 3, 3]);
  });

  it('flags overspent categories and total', () => {
    const categories = [
      { id: 'a', name: 'A', percent: 50 },
      { id: 'b', name: 'B', percent: 50 },
    ];
    const expenses = [
      { categoryId: 'a', amount: 600 },
      { categoryId: 'b', amount: 100 },
    ];
    const rows = budgetBreakdown(1000, categories, expenses);
    expect(rows[0]).toMatchObject({ allocated: 500, spent: 600, remaining: -100, overspent: true });
    expect(rows[1].overspent).toBe(false);

    const totals = budgetTotals(1000, categories, expenses);
    expect(totals).toMatchObject({ spent: 700, remaining: 300, overTotal: false });
    expect(totals.overCategories.map((c) => c.id)).toEqual(['a']);
    expect(budgetTotals(500, categories, expenses).overTotal).toBe(true);
  });

  it('caps progress at 100', () => {
    expect(progressPercent(50, 200)).toBe(25);
    expect(progressPercent(300, 200)).toBe(100);
    expect(progressPercent(10, 0)).toBe(100);
    expect(progressPercent(0, 0)).toBe(0);
  });
});
