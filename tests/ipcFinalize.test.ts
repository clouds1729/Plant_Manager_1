import { describe, expect, it } from 'vitest';
import { buildFinalizeIpcPayload } from '@/lib/calculations/ipcFinalize';

describe('finalize IPC payload', () => {
  const baseLine = { plant_id: 'p1', log_id: 'l1', log_date: '2026-05-01', hours: 8, rate: 10, subtotal: 80, tax_amount: 0, total: 80 };

  it('serializes RPC payload shape', () => {
    const payload = buildFinalizeIpcPayload({
      project_id: 'proj',
      supplier_id: 'sup',
      period_start: '2026-05-01',
      period_end: '2026-05-31',
      selected_plant_ids: ['p1'],
      tax_percent: 5,
      lines: [baseLine]
    });

    expect(payload.p_project_id).toBe('proj');
    expect(payload.p_selected_plant_ids).toEqual(['p1']);
    expect(payload.p_lines).toHaveLength(1);
  });

  it('blocks invalid period ranges', () => {
    expect(() =>
      buildFinalizeIpcPayload({
        project_id: 'proj',
        supplier_id: 'sup',
        period_start: '2026-05-31',
        period_end: '2026-05-01',
        selected_plant_ids: ['p1'],
        tax_percent: 0,
        lines: [baseLine]
      })
    ).toThrow(/Period end/);
  });

  it('blocks lines outside selected plants', () => {
    expect(() =>
      buildFinalizeIpcPayload({
        project_id: 'proj',
        supplier_id: 'sup',
        period_start: '2026-05-01',
        period_end: '2026-05-31',
        selected_plant_ids: ['p2'],
        tax_percent: 0,
        lines: [baseLine]
      })
    ).toThrow(/selected plants/);
  });
});
