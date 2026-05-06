import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatHours } from '@/lib/supplierPortalFormat';

describe('supplier portal formatting helpers', () => {
  it('formats currency with USD style', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(null)).toBe('—');
  });

  it('formats dates and handles missing/invalid values', () => {
    expect(formatDate('2026-05-01')).toBe('May 01, 2026');
    expect(formatDate('2026-05-01T05:00:00Z')).toBe('May 01, 2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('invalid-date')).toBe('invalid-date');
  });

  it('formats hours with consistent precision', () => {
    expect(formatHours(7)).toBe('7.00 hrs');
    expect(formatHours(7.125)).toBe('7.13 hrs');
    expect(formatHours(undefined)).toBe('—');
  });
});
