import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatINR,
  formatINRAscii,
  formatNumber,
  formatPercent,
  pluralize,
} from '../../src/lib/format.js';

describe('format', () => {
  it('formats rupees with lakh/crore grouping', () => {
    expect(formatINR(800000)).toBe('₹8,00,000');
    expect(formatINR(50000000)).toBe('₹5,00,00,000');
    expect(formatINR(1234.6)).toBe('₹1,235');
  });

  it('treats non-finite amounts as zero', () => {
    expect(formatINR(NaN)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
  });

  it('has an ASCII variant for PDFs', () => {
    expect(formatINRAscii(120000)).toBe('Rs. 1,20,000');
  });

  it('formats numbers, percents and plurals', () => {
    expect(formatNumber(5000)).toBe('5,000');
    expect(formatPercent(12.6)).toBe('13%');
    expect(pluralize(1, 'day')).toBe('1 day');
    expect(pluralize(3, 'day')).toBe('3 days');
  });

  it('formats ISO dates without timezone drift', () => {
    expect(formatDate('2027-01-18')).toBe('18 Jan 2027');
    expect(formatDate('bad')).toBe('');
  });
});
