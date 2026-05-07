import { describe, expect, it } from 'vitest';
import { normalizeDate, normalizeRegistrationNumber, normalizeTime } from '@/lib/imports/normalize';
import { buildImportReviewRows, matchPlantId, preparePlantLogPayload } from '@/lib/imports/workflow';
import { isImportCommitSummary } from '@/lib/imports/commit';

describe('import normalization', () => {
  it('normalizes date and time formats', () => {
    expect(normalizeDate('06/05/2026')).toBe('2026-05-06');
    expect(normalizeDate(46148)).toBe('2026-05-06');
    expect(normalizeTime('1:30 pm')).toBe('13:30');
  });

  it('normalizes registration numbers', () => {
    expect(normalizeRegistrationNumber(' ab-123 cd ')).toBe('AB123CD');
  });
});

describe('import matching and conflicts', () => {
  const plants = [{ id: 'p1', registration_number: 'AB-123' }];
  const logs = [{ id: 'l1', plant_id: 'p1', date: '2026-05-06' }];

  it('matches plant by normalized registration', () => {
    expect(matchPlantId(plants, 'ab123')).toBe('p1');
  });

  it('detects conflicts and unmatched rows', () => {
    const rows = buildImportReviewRows([
      { registration_number: 'AB123', date: '2026-05-06' },
      { registration_number: 'ZZ999', date: '2026-05-06' }
    ], plants, logs);
    expect(rows[0].conflict_status).toBe('conflict');
    expect(rows[1].plant_match_id).toBeNull();
  });

  it('matches plant using plant_id when registration_number is missing', () => {
    const [row] = buildImportReviewRows([
      { plant_id: 'p1', date: '2026-05-06' }
    ], plants, logs);
    expect(row.plant_match_id).toBe('p1');
    expect(row.validation_status).not.toBe('invalid');
  });



  it('stages parsed_data with gross_hours and billable_hours', () => {
    const [row] = buildImportReviewRows([
      { registration_number: 'AB123', date: '2026-05-07', start_time: '08:00', end_time: '17:00', lunch_hours: 1, unproductive_hours: 2, breakdown_hours: 1 }
    ], plants, logs);
    expect(row.parsed_data.gross_hours).toBe(8);
    expect(row.parsed_data.billable_hours).toBe(5);
  });

  it('prepares payload with calculated billable hours', () => {
    const [row] = buildImportReviewRows([
      { registration_number: 'AB123', date: '2026-05-07', start_time: '08:00', end_time: '17:00', lunch_hours: 1, unproductive_hours: 2, breakdown_hours: 1 }
    ], plants, logs);
    const payload = preparePlantLogPayload({ ...row, resolution_action: 'replace_existing' }, 'project-1');
    expect(payload.billable_hours).toBe(5);
  });
});

describe('import commit rpc summary shape', () => {
  it('accepts valid summary payload', () => {
    expect(isImportCommitSummary({ inserted_count: 1, updated_count: 2, skipped_count: 3 })).toBe(true);
  });

  it('rejects invalid summary payload', () => {
    expect(isImportCommitSummary({ inserted_count: '1', updated_count: 2, skipped_count: 3 })).toBe(false);
  });
});
