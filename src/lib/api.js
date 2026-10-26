// Fetch wrappers for /api. Any failure resolves to { fallback: true } — callers never throw.
import { CLIENT_TIMEOUT_MS } from './constants.js';
import { ChatResponseSchema, IdeasResponseSchema, PlanSchema, sanitizeUpdates } from './schema.js';

async function postJson(path, body, { timeoutMs = CLIENT_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return { fallback: true, reason: `http-${res.status}` };
    const data = await res.json();
    if (data?.fallback) return { fallback: true, reason: data.reason ?? 'server' };
    return { data };
  } catch (err) {
    return { fallback: true, reason: err?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** Re-validate on the client too: never trust the wire. */
export async function requestPlan(meta, options) {
  const result = await postJson('/api/plan', { meta }, options);
  if (result.fallback) return result;
  const parsed = PlanSchema.safeParse(result.data?.plan);
  return parsed.success ? { plan: parsed.data } : { fallback: true, reason: 'invalid' };
}

export async function requestIdeas(payload, options) {
  const result = await postJson('/api/ideas', payload, options);
  if (result.fallback) return result;
  const parsed = IdeasResponseSchema.safeParse(result.data);
  return parsed.success ? { ideas: parsed.data.ideas } : { fallback: true, reason: 'invalid' };
}

export async function requestChat(payload, options) {
  const result = await postJson('/api/chat', payload, options);
  if (result.fallback) return result;
  const parsed = ChatResponseSchema.safeParse(result.data);
  if (!parsed.success) return { fallback: true, reason: 'invalid' };
  return {
    reply: parsed.data.reply,
    proposedUpdates: sanitizeUpdates(parsed.data.proposedUpdates),
  };
}
