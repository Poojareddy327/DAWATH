import { describe, expect, it } from 'vitest';
import {
  addDays,
  countdownLabel,
  daysBetween,
  dueDate,
  groupTasksByPhase,
  isISODate,
  isOverdue,
  phaseFor,
  todayIST,
} from '../../src/lib/dates.js';

describe('todayIST', () => {
  it('uses India time, not UTC', () => {
    // 20:00 UTC on Oct 20 is 01:30 IST on Oct 21.
    expect(todayIST(new Date('2026-10-20T20:00:00Z'))).toBe('2026-10-21');
    expect(todayIST(new Date('2026-10-20T18:29:00Z'))).toBe('2026-10-20');
  });
});

describe('date maths', () => {
  it('validates ISO dates strictly', () => {
    expect(isISODate('2026-10-20')).toBe(true);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('20-10-2026')).toBe(false);
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-20', '2027-01-18')).toBe(90);
    expect(daysBetween('2026-10-20', '2026-10-19')).toBe(-1);
  });

  it('adds days and computes due dates', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(dueDate('2027-01-18', 90)).toBe('2026-10-20');
  });
});

describe('phaseFor (PRD FR-4)', () => {
  it.each([
    [31, 'booking'],
    [30, 'final-month'],
    [8, 'final-month'],
    [7, 'final-week'],
    [2, 'final-week'],
    [1, 'day-of'],
    [0, 'day-of'],
  ])('d=%i → %s', (d, phase) => {
    expect(phaseFor(d)).toBe(phase);
  });
});

describe('tasks', () => {
  it('flags unchecked tasks whose due date has passed', () => {
    const task = { dueDaysBefore: 30 };
    expect(isOverdue(task, '2026-11-10', '2026-10-20')).toBe(true);
    expect(isOverdue(task, '2026-11-10', '2026-10-20', true)).toBe(false);
    expect(isOverdue(task, '2026-12-10', '2026-10-20')).toBe(false);
  });

  it('groups tasks by phase, earliest first', () => {
    const groups = groupTasksByPhase([
      { id: 'a', dueDaysBefore: 10 },
      { id: 'b', dueDaysBefore: 40 },
      { id: 'c', dueDaysBefore: 20 },
      { id: 'd', dueDaysBefore: 0 },
    ]);
    expect(groups.booking.map((t) => t.id)).toEqual(['b']);
    expect(groups['final-month'].map((t) => t.id)).toEqual(['c', 'a']);
    expect(groups['day-of'].map((t) => t.id)).toEqual(['d']);
  });

  it('labels the countdown', () => {
    expect(countdownLabel(42)).toBe('42 days to go');
    expect(countdownLabel(1)).toBe('1 day to go');
    expect(countdownLabel(0)).toBe("It's today!");
    expect(countdownLabel(-2)).toBe('Event was 2 days ago');
  });
});
