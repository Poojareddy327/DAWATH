import { z } from 'zod';
import {
  CHAT_CONTEXT_MAX,
  CHAT_HISTORY_LIMIT,
  CHAT_MESSAGE_MAX,
  CULTURES,
  EVENT_TYPE_VALUES,
  LIMITS,
  MAX_UPDATES,
  STYLE_SEEDS,
  VENDOR_STATUSES,
} from './constants.js';
import { addDays, isISODate } from './dates.js';

// Caps keep a misbehaving model from flooding the UI or localStorage.
const id = z.string().trim().min(1).max(80);
const shortText = z.string().trim().min(1).max(160);
const longText = z.string().trim().max(600);

export const PrioritySchema = z.enum(['high', 'medium', 'low']);
export const VendorPrioritySchema = z.enum(['must-have', 'nice-to-have']);
export const IdeaSectionSchema = z.enum(['theme', 'food', 'activities', 'extras']);

export const CategorySchema = z.object({
  id,
  name: shortText,
  percent: z.number().min(0).max(100),
  notes: longText,
});

export const TaskSchema = z.object({
  id,
  title: shortText,
  dueDaysBefore: z.number().int().min(0).max(LIMITS.maxDaysAhead),
  category: shortText,
  priority: PrioritySchema,
});

export const VendorSchema = z.object({
  id,
  category: shortText,
  type: shortText,
  estCost: z.number().min(0).max(LIMITS.budgetMax),
  notes: longText,
  priority: VendorPrioritySchema,
});

export const IdeaSchema = z.object({
  title: shortText,
  description: longText.min(1),
  whyItFits: longText.min(1),
});

const ideaList = z.array(IdeaSchema).min(3).max(4);

export const IdeasSchema = z.object({
  theme: ideaList,
  food: ideaList,
  activities: ideaList,
  extras: ideaList,
});

/** PROMPT_SPEC §3 — the AI contract. The fallback planner must satisfy it too. */
export const PlanSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  budget: z.object({ categories: z.array(CategorySchema).min(5).max(8) }),
  tasks: z.array(TaskSchema).min(12).max(25),
  vendors: z.array(VendorSchema).min(5).max(12),
  ideas: IdeasSchema,
  warnings: z.array(z.string().trim().min(1).max(300)).max(8),
});

export const IdeasResponseSchema = z.object({ ideas: IdeasSchema });

// ---- Chat proposed updates (PROMPT_SPEC §5) ----

export const UpdateSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('set_budget_percent'),
    categoryId: id,
    percent: z.number().min(0).max(100),
  }),
  z.object({
    op: z.literal('add_task'),
    title: shortText,
    dueDaysBefore: z.number().int().min(0).max(LIMITS.maxDaysAhead),
    category: shortText,
    priority: PrioritySchema,
  }),
  z.object({
    op: z.literal('add_vendor'),
    category: shortText,
    type: shortText,
    estCost: z.number().min(0).max(LIMITS.budgetMax),
    notes: longText,
  }),
  z.object({
    op: z.literal('set_vendor_status'),
    vendorId: id,
    status: z.enum(VENDOR_STATUSES),
  }),
  z.object({
    op: z.literal('add_idea'),
    section: IdeaSectionSchema,
    title: shortText,
    description: longText.min(1),
    whyItFits: longText.min(1),
  }),
]);

/** The model's raw chat reply. Updates are validated one by one afterwards. */
export const ChatResponseSchema = z.object({
  reply: z.string().trim().min(1).max(2000),
  proposedUpdates: z.array(z.unknown()).max(20),
});

/** Keep only well-formed updates (unknown ops and bad fields are dropped), max 5. */
export function sanitizeUpdates(updates) {
  if (!Array.isArray(updates)) return [];
  const valid = [];
  for (const u of updates) {
    const parsed = UpdateSchema.safeParse(u);
    if (parsed.success) valid.push(parsed.data);
    if (valid.length === MAX_UPDATES) break;
  }
  return valid;
}

// ---- Intake (PRD FR-1) ----

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .optional()
    .transform((v) => v ?? '');

const blankToUndefined = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

/** Intake schema; date bounds depend on today's IST date. */
export function makeIntakeSchema(today) {
  const maxDate = addDays(today, LIMITS.maxDaysAhead);
  return z.object({
    type: z.enum(EVENT_TYPE_VALUES, { error: 'Choose an event type' }),
    date: z.preprocess(
      blankToUndefined,
      z
        .string({ error: 'Pick the event date' })
        .refine(isISODate, 'Pick a valid date')
        .refine((d) => d >= today, 'The date can’t be in the past')
        .refine((d) => d <= maxDate, 'Pick a date within the next 2 years'),
    ),
    budget: z
      .preprocess(
        blankToUndefined,
        z.coerce
          .number({ error: 'Enter your budget in ₹' })
          .min(LIMITS.budgetMin, 'Budget must be at least ₹5,000')
          .max(LIMITS.budgetMax, 'Budget must be at most ₹5,00,00,000'),
      )
      .transform(Math.round),
    guests: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ error: 'Enter the number of guests' })
        .int('Guests must be a whole number')
        .min(LIMITS.guestsMin, 'At least 5 guests')
        .max(LIMITS.guestsMax, 'At most 5,000 guests'),
    ),
    city: z
      .string({ error: 'Enter a city' })
      .trim()
      .min(LIMITS.cityMin, 'Enter a city (at least 2 characters)')
      .max(LIMITS.cityMax, 'City must be under 60 characters'),
    culture: z
      .union([z.enum(CULTURES), z.literal('')])
      .optional()
      .transform((v) => v ?? ''),
    prefs: optionalText(LIMITS.prefsMax),
  });
}

// ---- /api request bodies ----

export function makePlanRequestSchema(today) {
  return z.object({ meta: makeIntakeSchema(today) });
}

export const ChatRequestSchema = z.object({
  context: z.string().trim().min(1).max(CHAT_CONTEXT_MAX),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .max(CHAT_HISTORY_LIMIT),
  message: z.string().trim().min(1).max(CHAT_MESSAGE_MAX),
});

export const IdeasRequestSchema = z.object({
  meta: z.object({
    type: z.enum(EVENT_TYPE_VALUES),
    date: z.string().refine(isISODate),
    budget: z.number().min(LIMITS.budgetMin).max(LIMITS.budgetMax),
    guests: z.number().int().min(LIMITS.guestsMin).max(LIMITS.guestsMax),
    city: z.string().trim().min(LIMITS.cityMin).max(LIMITS.cityMax),
    culture: z.union([z.enum(CULTURES), z.literal('')]).default(''),
    prefs: z.string().trim().max(LIMITS.prefsMax).default(''),
  }),
  styleSeed: z.enum(STYLE_SEEDS),
  currentIdeaTitles: z.array(z.string().trim().max(160)).max(16).default([]),
});

// ---- Gemini response schema ----

const GEMINI_KEYS = new Set([
  'type',
  'properties',
  'required',
  'items',
  'enum',
  'anyOf',
  'minimum',
  'maximum',
  'description',
]);

/**
 * Convert a Zod schema to the JSON-Schema subset Gemini's `responseJsonSchema` accepts.
 * Array-length keywords are omitted: Gemini rejects them on a schema this size (HTTP 400).
 * Zod stays the source of truth — counts are stated in the prompt and enforced by Zod + repair.
 */
export function toGeminiSchema(zodSchema) {
  return prune(z.toJSONSchema(zodSchema, { target: 'draft-07', unrepresentable: 'any' }));
}

function prune(node) {
  if (Array.isArray(node)) return node.map(prune);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'oneOf') {
      out.anyOf = prune(value);
      continue;
    }
    if (key === 'const') {
      out.enum = [value];
      continue;
    }
    if (!GEMINI_KEYS.has(key)) continue;
    if (key === 'properties') {
      out.properties = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, prune(v)]));
    } else if (key === 'minimum' || key === 'maximum') {
      if (Math.abs(value) < Number.MAX_SAFE_INTEGER) out[key] = value;
    } else {
      out[key] = prune(value);
    }
  }
  return out;
}

const UpdateJsonSchema = toGeminiSchema(UpdateSchema);

export const GEMINI_SCHEMAS = {
  plan: toGeminiSchema(PlanSchema),
  ideas: toGeminiSchema(IdeasResponseSchema),
  chat: {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      proposedUpdates: { type: 'array', items: UpdateJsonSchema },
    },
    required: ['reply', 'proposedUpdates'],
  },
};

/** Compact, model-readable list of Zod issues for the repair prompt. */
export function formatZodIssues(error) {
  return error.issues
    .slice(0, 15)
    .map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}
