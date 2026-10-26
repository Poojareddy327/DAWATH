// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addDays, todayIST } from '../../src/lib/dates.js';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { finalizePlan } from '../../src/lib/postprocess.js';
import { PlanSchema } from '../../src/lib/schema.js';
import { PERSONAS, personaIntake } from '../../src/lib/samples.js';
import { apiError, geminiText, invoke } from './helpers.js';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const { default: handler } = await import('../../api/plan.js');

const today = todayIST();
const meta = personaIntake(PERSONAS[0], today);

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'test-key');
  vi.stubEnv('GEMINI_MODEL', 'model-a');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  generateContent.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('POST /api/plan', () => {
  it.each(PERSONAS.map((p) => [p.label, p]))(
    'returns a valid AI plan for %s',
    async (_l, persona) => {
      const input = personaIntake(persona, today);
      generateContent.mockResolvedValueOnce(geminiText(buildFallbackPlan(input, today)));
      const res = await invoke(handler, { body: { meta: input } });
      expect(res.status).toBe(200);
      expect(PlanSchema.safeParse(res.body.plan).success).toBe(true);
      const plan = finalizePlan(res.body.plan, input, today, 'ai');
      expect(plan.budget.categories.reduce((a, c) => a + c.percent, 0)).toBe(100);
    },
  );

  it('calls Gemini in JSON mode with a response schema and the spec temperature', async () => {
    generateContent.mockResolvedValueOnce(geminiText(buildFallbackPlan(meta, today)));
    await invoke(handler, { body: { meta } });
    const call = generateContent.mock.calls[0][0];
    expect(call.model).toBe('model-a');
    expect(call.config).toMatchObject({ responseMimeType: 'application/json', temperature: 0.7 });
    expect(call.config.responseJsonSchema.type).toBe('object');
    expect(call.config.systemInstruction).toMatch(/^You are Dawat/);
    expect(call.contents.at(-1).parts[0].text).toMatch(/^Create a complete event plan\./);
  });

  it('repairs invalid output once', async () => {
    generateContent
      .mockResolvedValueOnce(geminiText({ summary: 'partial' }))
      .mockResolvedValueOnce(geminiText(buildFallbackPlan(meta, today)));
    const res = await invoke(handler, { body: { meta } });
    expect(res.body.plan).toBeDefined();
    expect(generateContent).toHaveBeenCalledTimes(2);
    const repairTurn = generateContent.mock.calls[1][0].contents.at(-1).parts[0].text;
    expect(repairTurn).toMatch(/^Your previous response failed validation with these errors:\n- /);
  });

  it('falls back when the repair is still invalid', async () => {
    generateContent.mockResolvedValue(geminiText('not json at all'));
    const res = await invoke(handler, { body: { meta } });
    expect(res.body).toEqual({ fallback: true, reason: 'invalid' });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('falls back on 429', async () => {
    generateContent.mockRejectedValue(apiError(429));
    const res = await invoke(handler, { body: { meta } });
    expect(res.body).toEqual({ fallback: true, reason: 'rate-limit' });
  });

  it('tries the next configured model on 503 before falling back', async () => {
    vi.stubEnv('GEMINI_MODEL', 'model-a, model-b');
    generateContent
      .mockRejectedValueOnce(apiError(503))
      .mockResolvedValueOnce(geminiText(buildFallbackPlan(meta, today)));
    const res = await invoke(handler, { body: { meta } });
    expect(res.body.plan).toBeDefined();
    expect(generateContent.mock.calls.map((c) => c[0].model)).toEqual(['model-a', 'model-b']);
  });

  it('falls back after a 25 s timeout', async () => {
    vi.useFakeTimers();
    generateContent.mockReturnValue(new Promise(() => {}));
    const pending = invoke(handler, { body: { meta } });
    await vi.advanceTimersByTimeAsync(25000);
    expect((await pending).body).toEqual({ fallback: true, reason: 'timeout' });
    expect(generateContent.mock.calls[0][0].config.abortSignal.aborted).toBe(true);
  });

  it('falls back when the key is not configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const res = await invoke(handler, { body: { meta } });
    expect(res.body).toEqual({ fallback: true, reason: 'not-configured' });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('never logs the API key', async () => {
    generateContent.mockRejectedValue(Object.assign(apiError(400), { message: 'bad test-key' }));
    await invoke(handler, { body: { meta } });
    const logged = console.warn.mock.calls.flat().join(' ');
    expect(logged).not.toContain('test-key');
  });
});

describe('request validation', () => {
  it('rejects non-POST methods', async () => {
    const res = await invoke(handler, { method: 'GET' });
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe('POST');
  });

  it('rejects bodies over 20 KB', async () => {
    const res = await invoke(handler, { body: { meta: { ...meta, prefs: 'x'.repeat(21000) } } });
    expect(res.status).toBe(413);
    const declared = await invoke(handler, {
      body: { meta },
      headers: { 'content-length': '30000' },
    });
    expect(declared.status).toBe(413);
  });

  it('rejects invalid input with field paths only', async () => {
    const res = await invoke(handler, {
      body: { meta: { ...meta, budget: 10, date: addDays(today, -1) } },
    });
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual(expect.arrayContaining(['meta.budget', 'meta.date']));
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON strings', async () => {
    const res = await invoke(handler, { body: '{oops' });
    expect(res.status).toBe(400);
  });

  it('marks responses as uncacheable', async () => {
    const res = await invoke(handler, { method: 'GET' });
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
