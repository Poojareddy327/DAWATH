// localStorage adapter. Every access is guarded: private mode or a full quota must never crash the app.
import { STORAGE_KEY, THEME_KEY } from './constants.js';

function getStore() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function looksLikeEvent(value) {
  return (
    value?.version === 1 &&
    typeof value.meta?.date === 'string' &&
    Array.isArray(value.plan?.budget?.categories) &&
    Array.isArray(value.plan?.tasks) &&
    Array.isArray(value.plan?.vendors) &&
    typeof value.plan?.ideas === 'object' &&
    Array.isArray(value.expenses) &&
    Array.isArray(value.chat) &&
    typeof value.state === 'object'
  );
}

export function loadEvent() {
  try {
    const raw = getStore()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return looksLikeEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveEvent(event) {
  try {
    if (event) getStore()?.setItem(STORAGE_KEY, JSON.stringify(event));
    else getStore()?.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearEvent() {
  return saveEvent(null);
}

export function loadTheme() {
  try {
    const value = getStore()?.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme) {
  try {
    getStore()?.setItem(THEME_KEY, theme);
  } catch {
    // Theme preference is a convenience; ignore storage failures.
  }
}
