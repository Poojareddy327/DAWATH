import { describe, expect, it } from 'vitest';
import { buildBudgetLedgerCsv, buildVendorsCsv } from '../../src/lib/csv.js';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { createEvent } from '../../src/lib/store.js';
import { ARJUN, TODAY } from '../fixtures/personas.js';

describe('CSV export', () => {
  const plan = buildFallbackPlan(ARJUN, TODAY);
  const baseEvent = createEvent(ARJUN, plan, '2026-10-20T00:00:00.000Z');
  const event = {
    ...baseEvent,
    expenses: [
      {
        id: 'exp-1',
        categoryId: 'venue',
        item: 'Hall deposit, cash',
        amount: 12000,
        date: '2026-10-21',
      },
      {
        id: 'exp-2',
        categoryId: 'catering',
        item: 'Cake "custom"',
        amount: 4500,
        date: '2026-10-22',
      },
    ],
  };

  it('builds budget ledger CSV with category matrix and escaped expenses', () => {
    const csv = buildBudgetLedgerCsv(event);
    expect(csv).toContain('=== BUDGET CATEGORY MATRIX ===');
    expect(csv).toContain('=== DETAILED EXPENSE LEDGER ===');
    expect(csv).toContain('"Hall deposit, cash"');
    expect(csv).toContain('"Cake ""custom"""');
    expect(csv).toContain('12000');
  });

  it('builds vendor directory CSV with statuses and priorities', () => {
    const csv = buildVendorsCsv(event);
    expect(csv).toContain('"Vendor Type","Category","Priority"');
    expect(csv).toContain('Theme cake baker');
  });
});
