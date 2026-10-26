import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// Lazy-loaded views are transformed on first import, which can exceed the 1 s default.
configure({ asyncUtilTimeout: 15000 });

// Vitest runs without globals, so RTL can't register its own auto-cleanup.
afterEach(cleanup);

// jsdom lacks ResizeObserver (used by Recharts' ResponsiveContainer).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
