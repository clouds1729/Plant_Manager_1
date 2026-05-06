import { describe, expect, it } from 'vitest';
import { aggregateIpcLineTotals, buildIpcLinesCsv, type ReportIpcLine } from '@/lib/reports';

const sampleLine: ReportIpcLine = {
  id: 'l1', ipc_period_id: 'ipc1', plant_id: 'p1', hours: 8, rate: 100, subtotal: 800, tax_amount: 120, total: 920
};

describe('reports helpers', () => {
  it('aggregates totals across lines', () => {
    const totals = aggregateIpcLineTotals([
      sampleLine,
      { ...sampleLine, id: 'l2', subtotal: 200, tax_amount: 30, total: 230 }
    ]);
    expect(totals).toEqual({ subtotal: 1000, taxTotal: 150, total: 1150 });
  });

  it('returns zero totals for empty rows', () => {
    expect(aggregateIpcLineTotals([])).toEqual({ subtotal: 0, taxTotal: 0, total: 0 });
  });

  it('escapes CSV values and includes totals row', () => {
    const csv = buildIpcLinesCsv([
      { ...sampleLine, plant_id: 'plant,01' },
      { ...sampleLine, id: 'l2', plant_id: 'plant"02', ipc_period_id: 'ipc\n2' }
    ], { subtotal: 1600, taxTotal: 240, total: 1840 });

    expect(csv).toContain('"plant,01"');
    expect(csv).toContain('"plant""02"');
    expect(csv).toContain('"ipc\n2"');
    expect(csv.split('\n').at(-1)).toBe('TOTALS,,,,,1600,240,1840');
  });
});
