import { describe, expect, it, vi } from 'vitest';
import { requestChat, requestIdeas, requestPlan } from '../../src/lib/api.js';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { ARJUN, TODAY } from '../fixtures/personas.js';

const jsonResponse = (body, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

describe('client api wrappers', () => {
  it('returns a validated plan', async () => {
    const plan = buildFallbackPlan(ARJUN, TODAY);
    const fetchImpl = vi.fn(() => jsonResponse({ plan }));
    const result = await requestPlan(ARJUN, { fetchImpl });
    expect(result.plan.summary).toBe(plan.summary);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/plan',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it.each([
    [
      'server fallback flag',
      () => jsonResponse({ fallback: true, reason: 'rate-limit' }),
      'rate-limit',
    ],
    ['HTTP error', () => jsonResponse({}, 500), 'http-500'],
    ['network failure', () => Promise.reject(new TypeError('offline')), 'network'],
    ['invalid plan', () => jsonResponse({ plan: { summary: 'x' } }), 'invalid'],
  ])('falls back on %s', async (_label, impl, reason) => {
    const result = await requestPlan(ARJUN, { fetchImpl: vi.fn(impl) });
    expect(result).toEqual({ fallback: true, reason });
  });

  it('falls back on a client timeout', async () => {
    const fetchImpl = vi.fn(
      (_url, { signal }) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          ),
        ),
    );
    const result = await requestPlan(ARJUN, { fetchImpl, timeoutMs: 10 });
    expect(result).toEqual({ fallback: true, reason: 'timeout' });
  });

  it('validates ideas', async () => {
    const ideas = buildFallbackPlan(ARJUN, TODAY).ideas;
    expect((await requestIdeas({}, { fetchImpl: () => jsonResponse({ ideas }) })).ideas).toEqual(
      ideas,
    );
    expect(
      (await requestIdeas({}, { fetchImpl: () => jsonResponse({ ideas: {} }) })).fallback,
    ).toBe(true);
  });

  it('drops invalid chat updates', async () => {
    const body = {
      reply: 'Sure',
      proposedUpdates: [
        { op: 'nuke' },
        { op: 'set_vendor_status', vendorId: 'ven-a', status: 'paid' },
      ],
    };
    const result = await requestChat({}, { fetchImpl: () => jsonResponse(body) });
    expect(result.reply).toBe('Sure');
    expect(result.proposedUpdates).toEqual([body.proposedUpdates[1]]);
  });
});
