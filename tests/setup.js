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

// Suppress known Recharts zero-dimension warning in JSDOM (no layout engine)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('The width(0) and height(0) of chart should be greater than 0')
  ) {
    return;
  }
  originalWarn(...args);
};
