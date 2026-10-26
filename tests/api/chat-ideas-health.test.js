// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFallbackIdeas } from '../../src/lib/fallback.js';
import { geminiText, invoke } from './helpers.js';
import { PRIYA } from '../fixtures/personas.js';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const { default: chat } = await import('../../api/chat.js');
const { default: ideas } = await import('../../api/ideas.js');
const { default: health } = await import('../../api/health.js');

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'secret-key');
  vi.stubEnv('GEMINI_MODEL', 'model-a');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  generateContent.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/chat', () => {
  const body = {
    context: 'EVENT: wedding',
    history: [
      { role: 'user', text: 'Hi' },
      { role: 'assistant', text: 'Namaste!' },
    ],
    message: 'Plan B for rain',
  };

  it('returns the reply and only valid proposed updates', async () => {
    generateContent.mockResolvedValueOnce(
      geminiText({
        reply: 'Book a tent.',
        proposedUpdates: [
          {
            op: 'add_task',
            title: 'Book tent',
            dueDaysBefore: 14,
            category: 'Venue',
            priority: 'high',
          },
          { op: 'format_disk' },
        ],
      }),
    );
    const res = await invoke(chat, { body });
    expect(res.body.reply).toBe('Book a tent.');
    expect(res.body.proposedUpdates).toHaveLength(1);
  });

  it('sends history as prior turns and the spec chat prompt last', async () => {
    generateContent.mockResolvedValueOnce(geminiText({ reply: 'ok', proposedUpdates: [] }));
    await invoke(chat, { body });
    const { contents } = generateContent.mock.calls[0][0];
    expect(contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(contents[2].parts[0].text).toMatch(/^You are Dawat, the user's personal event planner/);
  });

  it('rejects oversized messages', async () => {
    const res = await invoke(chat, { body: { ...body, message: 'x'.repeat(501) } });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/ideas', () => {
  it('returns fresh ideas at temperature 0.9', async () => {
    const fresh = buildFallbackIdeas(PRIYA, 'eco');
    generateContent.mockResolvedValueOnce(geminiText({ ideas: fresh }));
    const res = await invoke(ideas, {
      body: { meta: PRIYA, styleSeed: 'eco', currentIdeaTitles: ['A'] },
    });
    expect(res.body.ideas).toEqual(fresh);
    expect(generateContent.mock.calls[0][0].config.temperature).toBe(0.9);
  });

  it('rejects unknown style seeds', async () => {
    const res = await invoke(ideas, { body: { meta: PRIYA, styleSeed: 'goth' } });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/health', () => {
  it('reports configuration without exposing the key', async () => {
    const res = await invoke(health, { method: 'GET' });
    expect(res.body).toEqual({ ok: true, hasKey: true, models: ['model-a'] });
    expect(JSON.stringify(res.body)).not.toContain('secret-key');
  });
});
