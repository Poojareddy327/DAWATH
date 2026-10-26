import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY } from '../../src/lib/constants.js';
import { buildFallbackPlan } from '../../src/lib/fallback.js';
import { finalizePlan } from '../../src/lib/postprocess.js';
import { clearEvent, loadEvent, loadTheme, saveEvent, saveTheme } from '../../src/lib/storage.js';
import { createEvent } from '../../src/lib/store.js';
import { ARJUN, TODAY } from '../fixtures/personas.js';

const event = createEvent(
  ARJUN,
  finalizePlan(buildFallbackPlan(ARJUN, TODAY), ARJUN, TODAY, 'fallback'),
  'now',
);

afterEach(() => localStorage.clear());

describe('storage adapter', () => {
  it('round-trips the event under utsav:v1:event', () => {
    expect(saveEvent(event)).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).version).toBe(1);
    expect(loadEvent()).toEqual(event);
  });

  it('clears the event', () => {
    saveEvent(event);
    clearEvent();
    expect(loadEvent()).toBeNull();
  });

  it('ignores corrupt or foreign data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadEvent()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2 }));
    expect(loadEvent()).toBeNull();
  });

  it('survives storage that throws (private mode / quota)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(saveEvent(event)).toBe(false);
    expect(() => saveTheme('dark')).not.toThrow();
  });

  it('stores only valid themes', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
    localStorage.setItem('utsav:theme', 'neon');
    expect(loadTheme()).toBeNull();
  });
});
