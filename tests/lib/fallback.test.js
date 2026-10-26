import { describe, expect, it } from 'vitest';
import { CULTURES, EVENT_TYPE_VALUES } from '../../src/lib/constants.js';
import { addDays } from '../../src/lib/dates.js';
import { buildFallbackIdeas, buildFallbackPlan } from '../../src/lib/fallback.js';
import { finalizePlan } from '../../src/lib/postprocess.js';
import { IdeasSchema, PlanSchema } from '../../src/lib/schema.js';
import { ARJUN, MEERA, PERSONA_CASES, PRIYA, TODAY } from '../fixtures/personas.js';

const WEDDING_VENDOR = /priest|mandap|bridal|mehendi|wedding|qazi|church/i;

describe.each(PERSONA_CASES)('fallback plan for %s', (_name, meta, daysLeft) => {
  const raw = buildFallbackPlan(meta, TODAY);
  const plan = finalizePlan(raw, meta, TODAY, 'fallback');

  it('passes the same Zod schema as the AI', () => {
    expect(PlanSchema.safeParse(raw).success).toBe(true);
  });

  it('has percents summing to 100 after normalization', () => {
    expect(plan.budget.categories.reduce((a, c) => a + c.percent, 0)).toBe(100);
  });

  it('includes a 5–10% contingency', () => {
    const contingency = plan.budget.categories.find((c) => /contingency/i.test(c.name));
    expect(contingency.percent).toBeGreaterThanOrEqual(5);
    expect(contingency.percent).toBeLessThanOrEqual(10);
  });

  it('fits every task within the days left', () => {
    expect(plan.tasks.length).toBe(raw.tasks.length);
    for (const task of plan.tasks) {
      expect(task.dueDaysBefore).toBeGreaterThanOrEqual(0);
      expect(task.dueDaysBefore).toBeLessThanOrEqual(daysLeft);
    }
  });

  it('keeps every vendor estimate inside the budget', () => {
    const total = plan.vendors.reduce((a, v) => a + v.estCost, 0);
    expect(total).toBeLessThanOrEqual(meta.budget);
  });

  it('is deterministic', () => {
    expect(buildFallbackPlan(meta, TODAY)).toEqual(raw);
  });
});

describe('fallback content rules (PROMPT_SPEC §8)', () => {
  it('Kerala input → food ideas mention sadhya', () => {
    for (const meta of [PRIYA, MEERA]) {
      const food = buildFallbackPlan(meta, TODAY).ideas.food;
      expect(food.some((i) => /sadhya/i.test(`${i.title} ${i.description}`))).toBe(true);
    }
  });

  it('birthday input → no wedding vendors', () => {
    const vendors = buildFallbackPlan(ARJUN, TODAY).vendors;
    expect(vendors.some((v) => WEDDING_VENDOR.test(v.type))).toBe(false);
  });

  it('tiny budget → a warning', () => {
    const plan = buildFallbackPlan({ ...PRIYA, budget: 40000 }, TODAY);
    expect(plan.warnings.some((w) => /tight/.test(w))).toBe(true);
  });

  it('comfortable budget → no budget warning', () => {
    expect(buildFallbackPlan(PRIYA, TODAY).warnings).toEqual([]);
  });

  it('adds culture-specific wedding tasks', () => {
    const titles = (culture) =>
      buildFallbackPlan({ ...PRIYA, culture }, TODAY).tasks.map((t) => t.title);
    expect(titles('Kerala')).toContain('Fix muhurtham with priest');
    expect(titles('Christian').some((t) => /banns/.test(t))).toBe(true);
    expect(titles('Muslim').some((t) => /nikah/i.test(t))).toBe(true);
  });

  it('respects vegetarian preferences in food ideas', () => {
    const food = buildFallbackPlan({ ...PRIYA, culture: 'Muslim', prefs: 'pure veg please' }, TODAY)
      .ideas.food;
    expect(food.some((i) => /biryani|kebab/i.test(i.title))).toBe(false);
  });

  it('compresses the schedule for an event today', () => {
    const plan = buildFallbackPlan({ ...PRIYA, date: TODAY }, TODAY);
    expect(plan.tasks.every((t) => t.dueDaysBefore === 0)).toBe(true);
    expect(PlanSchema.safeParse(plan).success).toBe(true);
  });
});

describe('fallback covers every valid intake', () => {
  const dates = [TODAY, addDays(TODAY, 3), addDays(TODAY, 45), addDays(TODAY, 730)];
  for (const type of EVENT_TYPE_VALUES) {
    it(`${type}: every culture, extreme budgets and dates pass the schema`, () => {
      for (const culture of ['', ...CULTURES]) {
        for (const date of dates) {
          for (const [budget, guests] of [
            [5000, 5000],
            [50000000, 5],
          ]) {
            const meta = { type, date, budget, guests, city: 'Ab', culture, prefs: 'veg' };
            const result = PlanSchema.safeParse(buildFallbackPlan(meta, TODAY));
            expect(result.success, `${type}/${culture}/${date}`).toBe(true);
          }
        }
      }
    });
  }
});

describe('buildFallbackIdeas', () => {
  it('returns valid ideas for every style seed', () => {
    for (const seed of ['traditional', 'modern-minimal', 'eco', 'budget-smart', 'grand']) {
      expect(IdeasSchema.safeParse(buildFallbackIdeas(ARJUN, seed)).success).toBe(true);
    }
  });

  it('changes the mix when the style changes', () => {
    const a = buildFallbackIdeas(ARJUN, 'traditional');
    const b = buildFallbackIdeas(ARJUN, 'eco');
    expect(a.theme.map((i) => i.title)).not.toEqual(b.theme.map((i) => i.title));
  });

  it('avoids current titles when it can', () => {
    const first = buildFallbackIdeas(ARJUN, 'eco');
    const avoid = first.theme.map((i) => i.title);
    const next = buildFallbackIdeas(ARJUN, 'eco', avoid);
    expect(next.theme.some((i) => avoid.includes(i.title))).toBe(false);
  });

  it('ties every "why it fits" to the user', () => {
    const ideas = buildFallbackIdeas(PRIYA, 'traditional');
    expect(ideas.food[0].whyItFits).toMatch(/Kerala|300/);
  });
});
