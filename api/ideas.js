import { TEMPERATURE, buildIdeasPrompt } from '../src/lib/prompts.js';
import { GEMINI_SCHEMAS, IdeasRequestSchema, IdeasResponseSchema } from '../src/lib/schema.js';
import { generateValidated } from './_lib/gemini.js';
import { invalidRequest, readJsonBody, send } from './_lib/http.js';

/** POST /api/ideas { meta, styleSeed, currentIdeaTitles } → { ideas } | { fallback: true } */
export default async function handler(req, res) {
  const input = readJsonBody(req, res);
  if (!input.ok) return;

  const parsed = IdeasRequestSchema.safeParse(input.body);
  if (!parsed.success) return invalidRequest(res, parsed.error);

  const { meta, styleSeed, currentIdeaTitles } = parsed.data;
  const result = await generateValidated({
    prompt: buildIdeasPrompt(meta, styleSeed, currentIdeaTitles),
    schema: IdeasResponseSchema,
    jsonSchema: GEMINI_SCHEMAS.ideas,
    temperature: TEMPERATURE.ideas,
  });

  if (result.fallback) return send(res, 200, { fallback: true, reason: result.reason });
  return send(res, 200, { ideas: result.data.ideas });
}
