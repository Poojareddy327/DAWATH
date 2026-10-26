/** Minimal stand-in for Vercel's req/res. Resolves with { status, body, headers }. */
export function invoke(handler, { method = 'POST', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const out = { status: 200, headers: {} };
    const res = {
      setHeader(name, value) {
        out.headers[name.toLowerCase()] = value;
      },
      status(code) {
        out.status = code;
        return res;
      },
      json(payload) {
        resolve({ ...out, body: payload });
      },
    };
    Promise.resolve(handler({ method, body, headers }, res)).catch(reject);
  });
}

/** A Gemini SDK response whose `.text` is the given JSON. */
export const geminiText = (value) => ({
  text: typeof value === 'string' ? value : JSON.stringify(value),
});

export const apiError = (status) => Object.assign(new Error(`HTTP ${status}`), { status });
