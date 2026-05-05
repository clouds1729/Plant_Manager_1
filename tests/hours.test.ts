import { describe, expect, it } from 'vitest';
import { calculateBillableHours, calculateGrossHours, isNotOnSite } from '@/lib/calculations/hours';

describe('hours calculations', () => {
  it('isNotOnSite true when both start and end missing', () => {
    expect(isNotOnSite(undefined, null)).toBe(true);
  });

  it('calculateGrossHours returns end-start-lunch', () => {
    expect(calculateGrossHours('08:00', '17:00', 1)).toBe(8);
  });

  it('calculateBillableHours returns gross-deductions', () => {
    expect(calculateBillableHours(8, 1.5, 0.5)).toBe(6);
  });

  it('clamps billable to zero when deductions exceed gross', () => {
    expect(calculateBillableHours(2, 2, 1)).toBe(0);
  });

  it('start/end existing with zero billable is still on site', () => {
    const gross = calculateGrossHours('08:00', '09:00', 0);
    const billable = calculateBillableHours(gross, 1, 0);
    expect(billable).toBe(0);
    expect(isNotOnSite('08:00', '09:00')).toBe(false);
  });
});
