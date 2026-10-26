import { describe, expect, it } from 'vitest';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { finalizePlan } from '../../src/lib/postprocess.js';
import { applyUpdate, createEvent, eventReducer } from '../../src/lib/store.js';
import { PRIYA, TODAY } from '../fixtures/personas.js';

const makeEvent = () =>
  createEvent(
    PRIYA,
    finalizePlan(buildFallbackPlan(PRIYA, TODAY), PRIYA, TODAY, 'fallback'),
    'now',
  );
const percentSum = (e) => e.plan.budget.categories.reduce((a, c) => a + c.percent, 0);

describe('eventReducer', () => {
  it('creates and resets an event', () => {
    const event = makeEvent();
    expect(eventReducer(null, { type: 'event/created', event })).toBe(event);
    expect(eventReducer(event, { type: 'event/reset' })).toBeNull();
    expect(eventReducer(null, { type: 'task/toggle', id: 'x' })).toBeNull();
  });

  it('rebalances budget percents', () => {
    const next = eventReducer(makeEvent(), {
      type: 'budget/setPercent',
      id: 'cat-venue',
      percent: 40,
    });
    expect(next.plan.budget.categories.find((c) => c.id === 'cat-venue').percent).toBe(40);
    expect(percentSum(next)).toBe(100);
  });

  it('adds, edits and removes expenses with stable ids', () => {
    let e = makeEvent();
    const expense = {
      categoryId: 'cat-venue',
      label: 'Advance',
      amount: 50000,
      date: TODAY,
      note: '',
    };
    e = eventReducer(e, { type: 'expense/add', expense });
    e = eventReducer(e, { type: 'expense/add', expense: { ...expense, label: 'Second' } });
    expect(e.expenses.map((x) => x.id)).toEqual(['exp-1', 'exp-2']);
    e = eventReducer(e, { type: 'expense/update', id: 'exp-1', changes: { amount: 60000 } });
    expect(e.expenses[0].amount).toBe(60000);
    e = eventReducer(e, { type: 'expense/remove', id: 'exp-1' });
    e = eventReducer(e, { type: 'expense/add', expense });
    expect(e.expenses.map((x) => x.id)).toEqual(['exp-2', 'exp-3']);
  });

  it('toggles, adds, edits and removes tasks', () => {
    let e = makeEvent();
    const id = e.plan.tasks[0].id;
    e = eventReducer(e, { type: 'task/toggle', id });
    expect(e.state.doneTaskIds).toEqual([id]);
    e = eventReducer(e, { type: 'task/update', id, changes: { dueDaysBefore: 5 } });
    expect(e.plan.tasks[0]).toMatchObject({ dueDaysBefore: 5, phase: 'final-week' });
    e = eventReducer(e, { type: 'task/remove', id });
    expect(e.state.doneTaskIds).toEqual([]);
    e = eventReducer(e, {
      type: 'task/add',
      task: { title: 'Book the venue', dueDaysBefore: 40, category: 'Venue', priority: 'high' },
    });
    expect(e.plan.tasks.at(-1)).toMatchObject({ id: 'task-book-the-venue', phase: 'booking' });
  });

  it('tracks vendor status and contacts and adds vendors', () => {
    let e = makeEvent();
    const id = e.plan.vendors[0].id;
    e = eventReducer(e, { type: 'vendor/setStatus', id, status: 'booked' });
    e = eventReducer(e, { type: 'vendor/setContact', id, contact: 'Ravi 98xxxx' });
    e = eventReducer(e, {
      type: 'vendor/add',
      vendor: { category: 'Decor', type: 'Florist', estCost: 5000.6, notes: '' },
    });
    expect(e.state.vendorStatus[id]).toBe('booked');
    expect(e.state.vendorContacts[id]).toBe('Ravi 98xxxx');
    expect(e.plan.vendors.at(-1)).toMatchObject({ id: 'ven-florist', estCost: 5001 });
  });

  it('replaces ideas and records the style', () => {
    const ideas = { theme: [], food: [], activities: [], extras: [] };
    const e = eventReducer(makeEvent(), { type: 'ideas/replace', ideas, styleSeed: 'eco' });
    expect(e.plan.ideas).toBe(ideas);
    expect(e.state.styleSeed).toBe('eco');
  });
});

describe('chat updates — applied only on Apply', () => {
  const withProposal = (data) => {
    const e = makeEvent();
    return eventReducer(e, {
      type: 'chat/add',
      message: {
        role: 'assistant',
        text: 'Try this',
        ts: 't',
        updates: [{ data, status: 'pending' }],
      },
    });
  };

  it('does nothing until the user resolves the card', () => {
    const e = withProposal({ op: 'set_budget_percent', categoryId: 'cat-venue', percent: 10 });
    expect(e.plan.budget.categories.find((c) => c.id === 'cat-venue').percent).toBe(25);
  });

  it('applies on Apply and marks it applied (once)', () => {
    let e = withProposal({ op: 'set_budget_percent', categoryId: 'cat-venue', percent: 10 });
    e = eventReducer(e, {
      type: 'chat/resolveUpdate',
      messageIndex: 0,
      updateIndex: 0,
      apply: true,
    });
    expect(e.plan.budget.categories.find((c) => c.id === 'cat-venue').percent).toBe(10);
    expect(percentSum(e)).toBe(100);
    expect(e.chat[0].updates[0].status).toBe('applied');
    const again = eventReducer(e, {
      type: 'chat/resolveUpdate',
      messageIndex: 0,
      updateIndex: 0,
      apply: true,
    });
    expect(again).toBe(e);
  });

  it('dismisses without changing the plan', () => {
    let e = withProposal({
      op: 'add_task',
      title: 'X',
      dueDaysBefore: 3,
      category: 'Y',
      priority: 'low',
    });
    const before = e.plan.tasks.length;
    e = eventReducer(e, {
      type: 'chat/resolveUpdate',
      messageIndex: 0,
      updateIndex: 0,
      apply: false,
    });
    expect(e.plan.tasks.length).toBe(before);
    expect(e.chat[0].updates[0].status).toBe('dismissed');
  });
});

describe('applyUpdate', () => {
  it('applies every allowed op', () => {
    let e = makeEvent();
    const vendorId = e.plan.vendors[0].id;
    e = applyUpdate(e, {
      op: 'add_task',
      title: 'Rain backup',
      dueDaysBefore: 14,
      category: 'Contingency',
      priority: 'high',
    });
    e = applyUpdate(e, {
      op: 'add_vendor',
      category: 'Decor',
      type: 'Tent house',
      estCost: 20000,
      notes: '',
    });
    e = applyUpdate(e, { op: 'set_vendor_status', vendorId, status: 'quoted' });
    e = applyUpdate(e, {
      op: 'add_idea',
      section: 'extras',
      title: 'Eco',
      description: 'd',
      whyItFits: 'w',
    });
    expect(e.plan.tasks.some((t) => t.title === 'Rain backup')).toBe(true);
    expect(e.plan.vendors.some((v) => v.type === 'Tent house')).toBe(true);
    expect(e.state.vendorStatus[vendorId]).toBe('quoted');
    expect(e.plan.ideas.extras.at(-1).title).toBe('Eco');
  });

  it('ignores unknown ops, invalid fields and unknown targets', () => {
    const e = makeEvent();
    expect(applyUpdate(e, { op: 'drop_table' })).toBe(e);
    expect(applyUpdate(e, { op: 'add_task', title: '' })).toBe(e);
    expect(applyUpdate(e, { op: 'set_budget_percent', categoryId: 'cat-nope', percent: 5 })).toBe(
      e,
    );
    expect(applyUpdate(e, { op: 'set_vendor_status', vendorId: 'ven-nope', status: 'paid' })).toBe(
      e,
    );
  });
});
