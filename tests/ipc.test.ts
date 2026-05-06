import { describe, expect, it } from 'vitest';
import { buildIpcPreview } from '@/lib/calculations/ipc';

describe('ipc calculation', () => {
  const logs = [
    { id: 'l1', plant_id: 'p1', date: '2026-05-01', billable_hours: 8 },
    { id: 'l2', plant_id: 'p2', date: '2026-05-02', billable_hours: 5 }
  ];

  it('calculates totals from generated line items', () => {
    const result = buildIpcPreview({
      logs,
      rates: [
        { plant_id: 'p1', rate: 100, unit: 'hour', effective_from: '2026-01-01' },
        { plant_id: 'p2', rate: 80, unit: 'hour', effective_from: '2026-01-01' }
      ],
      selectedPlantIds: ['p1', 'p2'],
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31'
    });
    expect(result.subtotal).toBe(1200);
    expect(result.total).toBe(result.lines.reduce((a, l) => a + l.total, 0));
  });

  it('filters by selected plants', () => {
    const result = buildIpcPreview({
      logs,
      rates: [{ plant_id: 'p1', rate: 100, unit: 'hour', effective_from: '2026-01-01' }],
      selectedPlantIds: ['p1'],
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31'
    });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].plant_id).toBe('p1');
  });

  it('detects missing rates and blocks finalization', () => {
    const result = buildIpcPreview({
      logs,
      rates: [{ plant_id: 'p1', rate: 100, unit: 'hour', effective_from: '2026-01-01' }],
      selectedPlantIds: ['p1', 'p2'],
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31'
    });
    expect(result.missingRateLogIds).toContain('l2');
    expect(result.canFinalize).toBe(false);
  });
});
