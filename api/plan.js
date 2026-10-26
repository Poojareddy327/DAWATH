import { todayIST } from '../src/lib/dates.js';
import { daysLeftUntil } from '../src/lib/postprocess.js';
import { TEMPERATURE, buildPlanPrompt } from '../src/lib/prompts.js';
import { GEMINI_SCHEMAS, PlanSchema, makePlanRequestSchema } from '../src/lib/schema.js';
import { generateValidated } from './_lib/gemini.js';
import { invalidRequest, readJsonBody, send } from './_lib/http.js';

/** POST /api/plan { meta } → { plan } | { fallback: true } */
export default async function handler(req, res) {
  const input = readJsonBody(req, res);
  if (!input.ok) return;

  const today = todayIST();
  const parsed = makePlanRequestSchema(today).safeParse(input.body);
  if (!parsed.success) return invalidRequest(res, parsed.error);

  const { meta } = parsed.data;
  const result = await generateValidated({
    prompt: buildPlanPrompt(meta, { today, daysLeft: daysLeftUntil(meta.date, today) }),
    schema: PlanSchema,
    jsonSchema: GEMINI_SCHEMAS.plan,
    temperature: TEMPERATURE.plan,
  });

  if (result.fallback) return send(res, 200, { fallback: true, reason: result.reason });
  return send(res, 200, { plan: result.data });
}
