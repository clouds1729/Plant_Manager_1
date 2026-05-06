import { describe, expect, it } from 'vitest';
import { findEffectiveRate } from '@/lib/calculations/rates';

describe('rate lookup', () => {
  it('returns most recent effective rate for date', () => {
    const rate = findEffectiveRate([
      { plant_id: 'p1', rate: 50, unit: 'hour', effective_from: '2026-01-01', effective_to: '2026-03-31' },
      { plant_id: 'p1', rate: 60, unit: 'hour', effective_from: '2026-04-01' }
    ], 'p1', '2026-04-20');
    expect(rate?.rate).toBe(60);
  });
});
