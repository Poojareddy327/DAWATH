// Chat helpers: compact plan context (PROMPT_SPEC §5), update descriptions, offline replies.
import { budgetBreakdown, budgetTotals } from './budget.js';
import { CHAT_CONTEXT_MAX, IDEA_SECTIONS, VENDOR_STATUS_LABELS } from './constants.js';
import { dueDate } from './dates.js';
import { formatDate, formatINR } from './format.js';
import { daysLeftUntil } from './postprocess.js';

/** A compact, model-readable summary of the plan — not the raw state. */
export function buildChatContext(event, today) {
  const { meta, plan, state, expenses } = event;
  const daysLeft = daysLeftUntil(meta.date, today);
  const totals = budgetTotals(meta.budget, plan.budget.categories, expenses);
  const done = new Set(state.doneTaskIds);

  const lines = [
    `EVENT: ${meta.type}, ${meta.date} (${daysLeft} days left, today ${today}), ${meta.guests} guests, ${meta.city}` +
      `${meta.culture ? `, culture ${meta.culture}` : ''}${meta.prefs ? `, preferences: ${meta.prefs}` : ''}`,
    `BUDGET: total ${formatINR(meta.budget)}, spent ${formatINR(totals.spent)}`,
    ...budgetBreakdown(meta.budget, plan.budget.categories, expenses).map(
      (c) =>
        `- ${c.id} "${c.name}": ${c.percent}% = ${formatINR(c.allocated)} allocated, ${formatINR(c.spent)} spent`,
    ),
    'OPEN TASKS (next 10):',
    ...plan.tasks
      .filter((t) => !done.has(t.id))
      .sort((a, b) => b.dueDaysBefore - a.dueDaysBefore)
      .slice(0, 10)
      .map((t) => `- ${t.title} (due ${dueDate(meta.date, t.dueDaysBefore)}, ${t.priority})`),
    'VENDORS:',
    ...plan.vendors.map(
      (v) =>
        `- ${v.id} ${v.type} [${v.category}] est ${formatINR(v.estCost)}: ${state.vendorStatus[v.id] ?? 'to-contact'}`,
    ),
    'IDEAS:',
    ...IDEA_SECTIONS.map(
      (s) => `- ${s.label}: ${plan.ideas[s.key].map((i) => i.title).join('; ')}`,
    ),
  ];
  return lines.join('\n').slice(0, CHAT_CONTEXT_MAX);
}

/** Human-readable label for a proposed update card. */
export function describeUpdate(update, plan) {
  switch (update.op) {
    case 'set_budget_percent': {
      const name =
        plan.budget.categories.find((c) => c.id === update.categoryId)?.name ?? update.categoryId;
      return `Set ${name} to ${Math.round(update.percent)}% of the budget (others rebalance)`;
    }
    case 'add_task':
      return `Add task “${update.title}” (${update.dueDaysBefore} days before, ${update.priority} priority)`;
    case 'add_vendor':
      return `Add vendor: ${update.type} (${update.category}, est. ${formatINR(update.estCost)})`;
    case 'set_vendor_status': {
      const vendor = plan.vendors.find((v) => v.id === update.vendorId);
      return `Mark ${vendor?.type ?? update.vendorId} as “${VENDOR_STATUS_LABELS[update.status]}”`;
    }
    case 'add_idea': {
      const section = IDEA_SECTIONS.find((s) => s.key === update.section)?.label ?? update.section;
      return `Add idea to ${section}: “${update.title}”`;
    }
    default:
      return 'Unknown change';
  }
}

/**
 * Rule-based reply used when the AI is unavailable, so the chat never dead-ends.
 * Covers the four quick chips; anything else gets a helpful pointer.
 */
export function buildFallbackChatReply(event, message, today) {
  const { meta, plan, state } = event;
  const text = message.toLowerCase();
  const daysLeft = daysLeftUntil(meta.date, today);
  const done = new Set(state.doneTaskIds);

  if (/this week|next 7|to do|todo/.test(text)) {
    const soon = plan.tasks.filter((t) => !done.has(t.id) && t.dueDaysBefore >= daysLeft - 7);
    if (soon.length === 0) {
      return {
        reply: 'Nothing is due this week — you’re ahead of schedule! 🎉',
        proposedUpdates: [],
      };
    }
    const list = soon
      .slice(0, 5)
      .map((t) => `• ${t.title} (by ${formatDate(dueDate(meta.date, t.dueDaysBefore))})`)
      .join('\n');
    return { reply: `Here’s what’s due in the next 7 days:\n${list}`, proposedUpdates: [] };
  }

  if (/rain|weather|plan b/.test(text)) {
    return {
      reply: `Good thinking — weather in ${meta.city} can change quickly. I suggest booking a covered backup and checking it a week out.`,
      proposedUpdates: [
        {
          op: 'add_task',
          title: 'Book a waterproof shamiana / indoor backup',
          dueDaysBefore: Math.min(daysLeft, 14),
          category: 'Contingency',
          priority: 'high',
        },
        {
          op: 'add_task',
          title: 'Check the weather forecast and confirm Plan B',
          dueDaysBefore: Math.min(daysLeft, 3),
          category: 'Contingency',
          priority: 'medium',
        },
      ],
    };
  }

  if (/eco|green|sustain|plastic/.test(text)) {
    return {
      reply: 'Lovely idea! Here are two easy eco swaps you can add to your plan.',
      proposedUpdates: [
        {
          op: 'add_idea',
          section: 'extras',
          title: 'Steel plates & cloth napkins',
          description: 'Rent steel plates and glasses instead of disposables.',
          whyItFits: `Avoids single-use waste for ${meta.guests} guests at a similar cost.`,
        },
        {
          op: 'add_idea',
          section: 'theme',
          title: 'Potted-plant centrepieces',
          description: 'Use plants as decor and give them away as return gifts.',
          whyItFits: 'Doubles as decor and a gift, so nothing goes to waste.',
        },
      ],
    };
  }

  if (/cut|reduce|lower|save|cheaper/.test(text)) {
    const flexible = plan.budget.categories.filter((c) =>
      /decor|entertain|photo|gift|attire|branding/i.test(c.name),
    );
    return {
      reply:
        'To spend about 20% less, trim the flexible categories and keep the difference unspent in Contingency. I’ve suggested smaller shares for the nice-to-haves.',
      proposedUpdates: flexible.slice(0, 3).map((c) => ({
        op: 'set_budget_percent',
        categoryId: c.id,
        percent: Math.max(1, Math.round(c.percent * 0.8)),
      })),
    };
  }

  return {
    reply:
      'The AI assistant is busy right now. Meanwhile, try a quick chip — “What should I do this week?”, “Plan B for rain”, “Make it eco-friendly” or “Cut budget by 20%”.',
    proposedUpdates: [],
  };
}
