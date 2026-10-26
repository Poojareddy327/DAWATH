const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

const safe = (n) => (Number.isFinite(n) ? n : 0);

/** ₹ with lakh/crore grouping, e.g. 800000 → "₹8,00,000". */
export function formatINR(amount) {
  return inr.format(safe(amount));
}

/** ASCII-safe variant for jsPDF's built-in fonts, which have no ₹ glyph. */
export function formatINRAscii(amount) {
  return `Rs. ${plain.format(safe(amount))}`;
}

export function formatNumber(n) {
  return plain.format(safe(n));
}

/** "YYYY-MM-DD" → "18 Jan 2027" (formatted in UTC so the calendar date never shifts). */
export function formatDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatPercent(n) {
  return `${Math.round(safe(n))}%`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
