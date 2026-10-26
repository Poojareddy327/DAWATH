import { getConfig } from './_lib/gemini.js';
import { send } from './_lib/http.js';

/** GET /api/health — reports whether the server is configured. Never reveals the key. */
export default function handler(req, res) {
  const { apiKey, models } = getConfig();
  send(res, 200, { ok: true, hasKey: Boolean(apiKey), models });
}
