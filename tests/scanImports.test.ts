import { describe, expect, it } from 'vitest';
import { buildScanReviewRows, extractScanRows } from '@/lib/imports/scan';

describe('scan import review rows', () => {
  const plants = [{ id: 'p1', registration_number: 'AB-123' }];
  const logs = [{ id: 'l1', plant_id: 'p1', date: '2026-05-06' }];

  it('normalizes scan rows into import review format', () => {
    const rows = buildScanReviewRows([{ registration_number: 'ab123', date: '2026-05-06', extraction_confidence: 0.99 }], plants, logs);
    expect(rows[0].plant_match_id).toBe('p1');
    expect(rows[0].parsed_data.registration_number).toBe('AB123');
  });

  it('marks low-confidence rows as requires_review', () => {
    const rows = buildScanReviewRows([{ registration_number: 'ab123', date: '2026-05-06', extraction_confidence: 0.3 }], plants, logs);
    expect(rows[0].parsed_data.requires_review).toBe(true);
  });

  it('supports source_type scan staging metadata', () => {
    const rows = buildScanReviewRows([{ registration_number: 'ab123', date: '2026-05-06', extraction_confidence: 0.9 }], plants, logs);
    expect(rows[0].parsed_data.extraction_confidence).toBe(0.9);
  });
});

describe('scan extraction configuration', () => {
  it('returns extraction_not_configured when provider env is missing', async () => {
    delete process.env.SCAN_IMPORT_PROVIDER;
    const file = new File(['AB123'], 'scan.txt', { type: 'text/plain' });
    const result = await extractScanRows(file);
    expect(result.configured).toBe(false);
    if (!result.configured) {
      expect(result.reason).toBe('extraction_not_configured');
    }
  });
});
