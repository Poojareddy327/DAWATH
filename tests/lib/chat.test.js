import { describe, expect, it } from 'vitest';
import { buildChatContext, buildFallbackChatReply, describeUpdate } from '../../src/lib/chat.js';
import { CHAT_CONTEXT_MAX } from '../../src/lib/constants.js';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { finalizePlan } from '../../src/lib/postprocess.js';
import { sanitizeUpdates } from '../../src/lib/schema.js';
import { createEvent } from '../../src/lib/store.js';
import { PRIYA, TODAY } from '../fixtures/personas.js';

const event = createEvent(
  PRIYA,
  finalizePlan(buildFallbackPlan(PRIYA, TODAY), PRIYA, TODAY, 'fallback'),
  'now',
);

describe('buildChatContext', () => {
  const context = buildChatContext(
    {
      ...event,
      expenses: [
        {
          id: 'exp-1',
          categoryId: 'cat-venue',
          label: 'Advance',
          amount: 50000,
          date: TODAY,
          note: '',
        },
      ],
    },
    TODAY,
  );

  it('summarises meta, budget, open tasks, vendors and ideas', () => {
    expect(context).toMatch(/EVENT: wedding, 2027-01-18 \(90 days left/);
    expect(context).toMatch(/cat-venue "Venue": 25% = ₹2,00,000 allocated, ₹50,000 spent/);
    expect(context).toMatch(/OPEN TASKS \(next 10\):/);
    expect(context).toMatch(/to-contact/);
    expect(context).toMatch(/Food & Menu: .*sadhya/i);
  });

  it('lists at most 10 open tasks and stays compact', () => {
    const taskLines = context
      .split('VENDORS:')[0]
      .split('OPEN TASKS')[1]
      .trim()
      .split('\n')
      .slice(1);
    expect(taskLines.length).toBeLessThanOrEqual(10);
    expect(context.length).toBeLessThanOrEqual(CHAT_CONTEXT_MAX);
  });
});

describe('describeUpdate', () => {
  it('describes each op in plain language', () => {
    expect(
      describeUpdate(
        { op: 'set_budget_percent', categoryId: 'cat-venue', percent: 20 },
        event.plan,
      ),
    ).toBe('Set Venue to 20% of the budget (others rebalance)');
    expect(
      describeUpdate(
        { op: 'set_vendor_status', vendorId: event.plan.vendors[0].id, status: 'booked' },
        event.plan,
      ),
    ).toMatch(/Mark .* as “Booked”/);
  });
});

describe('buildFallbackChatReply', () => {
  it.each([
    ['Plan B for rain', 'add_task'],
    ['Make it eco-friendly', 'add_idea'],
    ['Cut budget by 20%', 'set_budget_percent'],
  ])('“%s” proposes valid %s updates', (message, op) => {
    const reply = buildFallbackChatReply(event, message, TODAY);
    expect(reply.reply.length).toBeGreaterThan(0);
    expect(reply.proposedUpdates.length).toBeGreaterThan(0);
    expect(sanitizeUpdates(reply.proposedUpdates)).toHaveLength(reply.proposedUpdates.length);
    expect(reply.proposedUpdates.every((u) => u.op === op)).toBe(true);
  });

  it('answers “this week” from the timeline', () => {
    const soon = buildFallbackChatReply(event, 'What should I do this week?', '2027-01-15');
    expect(soon.reply).toMatch(/next 7 days/);
  });

  it('has a helpful default', () => {
    expect(buildFallbackChatReply(event, 'hello', TODAY).proposedUpdates).toEqual([]);
  });
});
