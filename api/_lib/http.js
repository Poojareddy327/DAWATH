import { MAX_BODY_BYTES } from '../../src/lib/constants.js';

export function send(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(payload);
}

/**
 * Accept only POST JSON bodies up to 20 KB. On failure the response is already sent
 * and `{ ok: false }` is returned.
 */
export function readJsonBody(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { error: 'Method not allowed' });
    return { ok: false };
  }

  const declared = Number(req.headers?.['content-length'] ?? 0);
  if (declared > MAX_BODY_BYTES) {
    send(res, 413, { error: 'Request body too large' });
    return { ok: false };
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    send(res, 400, { error: 'Invalid JSON' });
    return { ok: false };
  }

  if (body === undefined || body === null || typeof body !== 'object') {
    send(res, 400, { error: 'Expected a JSON object' });
    return { ok: false };
  }
  if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) {
    send(res, 413, { error: 'Request body too large' });
    return { ok: false };
  }
  return { ok: true, body };
}

/** Field paths only — never echo user input back. */
export function invalidRequest(res, error) {
  const fields = [...new Set(error.issues.map((i) => i.path.join('.')))];
  send(res, 400, { error: 'Invalid request', fields });
}
