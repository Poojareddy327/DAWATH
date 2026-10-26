const DAY_MS = 86400000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const istFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's calendar date in India (IST), as "YYYY-MM-DD". */
export function todayIST(now = new Date()) {
  return istFormatter.format(now);
}

export function isISODate(value) {
  const m = ISO_RE.exec(String(value));
  if (!m) return false;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return date.getUTCMonth() === +m[2] - 1 && date.getUTCDate() === +m[3];
}

function toUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `fromISO` to `toISO` (negative when `toISO` is earlier). */
export function daysBetween(fromISO, toISO) {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / DAY_MS);
}

export function addDays(iso, days) {
  return new Date(toUTC(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Calendar date a task is due: event date − dueDaysBefore. */
export function dueDate(eventDate, dueDaysBefore) {
  return addDays(eventDate, -dueDaysBefore);
}

/** PRD FR-4 phase buckets. */
export function phaseFor(dueDaysBefore) {
  if (dueDaysBefore > 30) return 'booking';
  if (dueDaysBefore >= 8) return 'final-month';
  if (dueDaysBefore >= 2) return 'final-week';
  return 'day-of';
}

export function isOverdue(task, eventDate, today, done = false) {
  return !done && dueDate(eventDate, task.dueDaysBefore) < today;
}

/** Group tasks by phase, each group sorted from earliest to latest due date. */
export function groupTasksByPhase(tasks) {
  const groups = { booking: [], 'final-month': [], 'final-week': [], 'day-of': [] };
  for (const task of tasks) groups[phaseFor(task.dueDaysBefore)].push(task);
  for (const list of Object.values(groups)) list.sort((a, b) => b.dueDaysBefore - a.dueDaysBefore);
  return groups;
}

export function countdownLabel(daysLeft) {
  if (daysLeft > 1) return `${daysLeft} days to go`;
  if (daysLeft === 1) return '1 day to go';
  if (daysLeft === 0) return "It's today!";
  return `Event was ${Math.abs(daysLeft)} ${daysLeft === -1 ? 'day' : 'days'} ago`;
}
