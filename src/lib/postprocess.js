import { normalizePercents } from './budget.js';
import { daysBetween, phaseFor } from './dates.js';
import { dedupeIds } from './ids.js';

/** Days from today (IST) to the event, never negative. */
export function daysLeftUntil(eventDate, today) {
  return Math.max(0, daysBetween(today, eventDate));
}

/**
 * Normalize task timing: round to whole days, clamp negatives to 0, drop tasks that would be
 * due before today (PRD FR-2), then assign the FR-4 phase.
 */
export function fitTasks(tasks, daysLeft) {
  return tasks
    .map((t) => ({ ...t, dueDaysBefore: Math.max(0, Math.round(t.dueDaysBefore)) }))
    .filter((t) => t.dueDaysBefore <= daysLeft)
    .map((t) => ({ ...t, phase: phaseFor(t.dueDaysBefore) }));
}

/**
 * Post-processing applied to every plan, AI or fallback (PRD FR-2, PROMPT_SPEC §3).
 * We trust our maths, not the model's: percents are normalized here and ₹ amounts are
 * always derived from them at render time.
 */
export function finalizePlan(raw, meta, today, source) {
  const daysLeft = daysLeftUntil(meta.date, today);
  return {
    summary: raw.summary,
    budget: { categories: normalizePercents(dedupeIds(raw.budget.categories)) },
    tasks: fitTasks(dedupeIds(raw.tasks), daysLeft),
    vendors: dedupeIds(raw.vendors).map((v) => ({ ...v, estCost: Math.round(v.estCost) })),
    ideas: raw.ideas,
    warnings: raw.warnings,
    source,
  };
}
