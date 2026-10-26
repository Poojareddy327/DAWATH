import { describe, expect, it } from 'vitest';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import {
  ChatRequestSchema,
  GEMINI_SCHEMAS,
  IdeasRequestSchema,
  PlanSchema,
  formatZodIssues,
  sanitizeUpdates,
  toGeminiSchema,
} from '../../src/lib/schema.js';
import { PRIYA, TODAY } from '../fixtures/personas.js';
import { z } from 'zod';

const validPlan = () => structuredClone(buildFallbackPlan(PRIYA, TODAY));

describe('PlanSchema', () => {
  it('accepts a complete plan', () => {
    expect(PlanSchema.safeParse(validPlan()).success).toBe(true);
  });

  it.each([
    ['too few categories', (p) => (p.budget.categories = p.budget.categories.slice(0, 4))],
    ['too few tasks', (p) => (p.tasks = p.tasks.slice(0, 5))],
    ['negative dueDaysBefore', (p) => (p.tasks[0].dueDaysBefore = -1)],
    ['fractional dueDaysBefore', (p) => (p.tasks[0].dueDaysBefore = 1.5)],
    ['bad priority', (p) => (p.tasks[0].priority = 'urgent')],
    ['too many vendors', (p) => (p.vendors = Array(13).fill(p.vendors[0]))],
    ['only 2 food ideas', (p) => (p.ideas.food = p.ideas.food.slice(0, 2))],
    ['missing summary', (p) => delete p.summary],
    ['percent over 100', (p) => (p.budget.categories[0].percent = 140)],
  ])('rejects %s', (_label, mutate) => {
    const plan = validPlan();
    mutate(plan);
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });

  it('strips unknown keys', () => {
    const plan = { ...validPlan(), extra: 'x' };
    expect(PlanSchema.parse(plan)).not.toHaveProperty('extra');
  });

  it('formats issues for the repair prompt', () => {
    const plan = validPlan();
    plan.tasks[0].priority = 'urgent';
    const text = formatZodIssues(PlanSchema.safeParse(plan).error);
    expect(text).toMatch(/^- tasks\.0\.priority:/);
  });
});

describe('sanitizeUpdates', () => {
  it('keeps valid ops, drops unknown or malformed ones, caps at 5', () => {
    const updates = [
      { op: 'set_budget_percent', categoryId: 'cat-venue', percent: 20 },
      { op: 'delete_everything' },
      { op: 'add_task', title: 'x' },
      { op: 'set_vendor_status', vendorId: 'ven-a', status: 'booked' },
      ...Array(6).fill({ op: 'set_vendor_status', vendorId: 'ven-b', status: 'paid' }),
    ];
    const result = sanitizeUpdates(updates);
    expect(result).toHaveLength(5);
    expect(result[0].op).toBe('set_budget_percent');
    expect(result.some((u) => u.op === 'delete_everything')).toBe(false);
  });

  it('returns [] for non-arrays', () => {
    expect(sanitizeUpdates(null)).toEqual([]);
  });
});

describe('request schemas', () => {
  it('limits chat history and message length', () => {
    const base = { context: 'ctx', history: [], message: 'hi' };
    expect(ChatRequestSchema.safeParse(base).success).toBe(true);
    expect(ChatRequestSchema.safeParse({ ...base, message: 'x'.repeat(501) }).success).toBe(false);
    const history = Array(7).fill({ role: 'user', text: 'a' });
    expect(ChatRequestSchema.safeParse({ ...base, history }).success).toBe(false);
  });

  it('only allows known style seeds', () => {
    const body = { meta: PRIYA, styleSeed: 'eco', currentIdeaTitles: [] };
    expect(IdeasRequestSchema.safeParse(body).success).toBe(true);
    expect(IdeasRequestSchema.safeParse({ ...body, styleSeed: 'cyberpunk' }).success).toBe(false);
  });
});

describe('toGeminiSchema', () => {
  it('keeps only keywords Gemini accepts', () => {
    const json = JSON.stringify(GEMINI_SCHEMAS.plan);
    expect(json).not.toMatch(/\$schema|additionalProperties|minItems|maxItems|minLength/);
    expect(GEMINI_SCHEMAS.plan.required).toEqual(
      expect.arrayContaining(['summary', 'budget', 'tasks', 'vendors', 'ideas', 'warnings']),
    );
  });

  it('turns unions into anyOf and literals into enums', () => {
    const items = GEMINI_SCHEMAS.chat.properties.proposedUpdates.items;
    expect(items.anyOf).toHaveLength(5);
    expect(items.anyOf[0].properties.op).toEqual({ type: 'string', enum: ['set_budget_percent'] });
  });

  it('drops unsafe-integer bounds', () => {
    expect(toGeminiSchema(z.number().int())).toEqual({ type: 'integer' });
  });
});
