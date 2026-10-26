import { TEMPERATURE, buildChatPrompt } from '../src/lib/prompts.js';
import {
  ChatRequestSchema,
  ChatResponseSchema,
  GEMINI_SCHEMAS,
  sanitizeUpdates,
} from '../src/lib/schema.js';
import { generateValidated } from './_lib/gemini.js';
import { invalidRequest, readJsonBody, send } from './_lib/http.js';

/** POST /api/chat { context, history, message } → { reply, proposedUpdates } | { fallback: true } */
export default async function handler(req, res) {
  const input = readJsonBody(req, res);
  if (!input.ok) return;

  const parsed = ChatRequestSchema.safeParse(input.body);
  if (!parsed.success) return invalidRequest(res, parsed.error);

  const { context, history, message } = parsed.data;
  const result = await generateValidated({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    prompt: buildChatPrompt(context, message),
    schema: ChatResponseSchema,
    jsonSchema: GEMINI_SCHEMAS.chat,
    temperature: TEMPERATURE.chat,
  });

  if (result.fallback) return send(res, 200, { fallback: true, reason: result.reason });
  return send(res, 200, {
    reply: result.data.reply,
    proposedUpdates: sanitizeUpdates(result.data.proposedUpdates),
  });
}
