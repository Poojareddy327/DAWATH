import { describe, expect, it } from 'vitest';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { buildBudgetSummary } from '../../src/lib/pdf.js';
import { finalizePlan } from '../../src/lib/postprocess.js';
import { createEvent } from '../../src/lib/store.js';
import { MEERA, TODAY } from '../fixtures/personas.js';

describe('buildBudgetSummary', () => {
  const event = {
    ...createEvent(
      MEERA,
      finalizePlan(buildFallbackPlan(MEERA, TODAY), MEERA, TODAY, 'fallback'),
      'now',
    ),
    expenses: [
      {
        id: 'exp-1',
        categoryId: 'cat-catering',
        label: 'Caterer advance',
        amount: 60000,
        date: TODAY,
        note: '',
      },
    ],
  };
  const summary = buildBudgetSummary(event);

  it('uses ASCII rupee text (jsPDF fonts lack ₹)', () => {
    expect(summary.subtitle).toBe('150 guests · Total budget Rs. 1,20,000');
    expect(JSON.stringify(summary)).not.toContain('₹');
  });

  it('includes every category, the totals and expenses', () => {
    expect(summary.rows).toHaveLength(event.plan.budget.categories.length);
    expect(summary.totals).toEqual(['Total', '100%', 'Rs. 1,20,000', 'Rs. 60,000', 'Rs. 60,000']);
    expect(summary.expenses[0]).toEqual([
      '20 Oct 2026',
      'Catering',
      'Caterer advance',
      'Rs. 60,000',
    ]);
    expect(summary.overspent).toBe(true);
  });
});
