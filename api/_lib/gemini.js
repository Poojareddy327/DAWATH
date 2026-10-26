// Shared Gemini call: JSON mode + response schema → Zod → one repair retry → fallback flag.
// Files under api/_lib are helpers, not routes (Vercel skips paths starting with "_").
import { GoogleGenAI } from '@google/genai';
import { AI_TIMEOUT_MS } from '../../src/lib/constants.js';
import { SYSTEM_INSTRUCTION, buildRepairPrompt } from '../../src/lib/prompts.js';
import { formatZodIssues } from '../../src/lib/schema.js';

const MAX_REPAIR_ECHO = 12000;

/**
 * GEMINI_MODEL may list several ids, comma-separated, tried in order when one is
 * rate-limited or overloaded (e.g. "gemini-3.5-flash,gemini-3.5-flash-lite").
 */
export function getConfig() {
  const models = (process.env.GEMINI_MODEL ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return { apiKey: process.env.GEMINI_API_KEY?.trim() ?? '', models };
}

/** Errors worth retrying on the next model in the list. */
const isRetryable = (err) => err?.status === 429 || err?.status === 404 || err?.status >= 500;

class DeadlineError extends Error {
  name = 'DeadlineError';
}

function parseAndValidate(raw, schema) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, errors: '- (root): the response was not valid JSON' };
  }
  const result = schema.safeParse(json);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, errors: formatZodIssues(result.error) };
}

/** Map an SDK/network error to a short, key-free reason string. */
export function classifyError(err) {
  if (err instanceof DeadlineError || err?.name === 'AbortError') return 'timeout';
  if (err?.status === 429) return 'rate-limit';
  if (err?.status >= 500) return 'unavailable';
  return 'error';
}

/**
 * Generate JSON that passes `schema`, or return `{ fallback: true, reason }`.
 * Never throws. The whole exchange (first call + repair) shares one deadline.
 *
 * @param {object} p
 * @param {string} p.prompt        the user-turn prompt
 * @param {import('zod').ZodType} p.schema  Zod schema (source of truth)
 * @param {object} p.jsonSchema    Gemini response schema derived from it
 * @param {number} p.temperature
 * @param {Array}  [p.history]     prior turns as Gemini `contents`
 */
export async function generateValidated({
  prompt,
  schema,
  jsonSchema,
  temperature,
  history = [],
  timeoutMs = AI_TIMEOUT_MS,
}) {
  const { apiKey, models } = getConfig();
  if (!apiKey || models.length === 0) return { fallback: true, reason: 'not-configured' };

  const ai = new GoogleGenAI({ apiKey });
  const controller = new AbortController();
  let modelIndex = 0;
  const call = async (contents) => {
    for (;;) {
      try {
        const response = await ai.models.generateContent({
          model: models[modelIndex],
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseJsonSchema: jsonSchema,
            temperature,
            abortSignal: controller.signal,
          },
        });
        return response.text ?? '';
      } catch (err) {
        if (!isRetryable(err) || modelIndex >= models.length - 1) throw err;
        console.warn(`[gemini] ${err.status} on model #${modelIndex + 1}, trying the next one`);
        modelIndex += 1;
      }
    }
  };

  const run = async () => {
    const contents = [...history, { role: 'user', parts: [{ text: prompt }] }];
    const raw = await call(contents);
    const first = parseAndValidate(raw, schema);
    if (first.ok) return { data: first.data, repaired: false };

    const repair = buildRepairPrompt(first.errors, raw.slice(0, MAX_REPAIR_ECHO));
    const raw2 = await call([
      ...contents,
      { role: 'model', parts: [{ text: raw }] },
      { role: 'user', parts: [{ text: repair }] },
    ]);
    const second = parseAndValidate(raw2, schema);
    if (second.ok) return { data: second.data, repaired: true };
    return { fallback: true, reason: 'invalid' };
  };

  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DeadlineError('Gemini deadline exceeded'));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([run(), deadline]);
    if (result.fallback) console.warn(`[gemini] fallback: ${result.reason}`);
    return result;
  } catch (err) {
    const reason = classifyError(err);
    // Log only the classification and status code — never the key, prompt or headers.
    console.warn(`[gemini] fallback: ${reason}${err?.status ? ` (${err.status})` : ''}`);
    return { fallback: true, reason };
  } finally {
    clearTimeout(timer);
  }
}
