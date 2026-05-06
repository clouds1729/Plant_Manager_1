import { buildImportReviewRows, type ImportReviewRow } from '@/lib/imports/workflow';

export type ScanExtractionItem = Record<string, unknown> & {
  extraction_confidence?: number;
};

export type ScanExtractionSuccess = {
  configured: true;
  rows: ScanExtractionItem[];
};

export type ScanExtractionNotConfigured = {
  configured: false;
  reason: 'extraction_not_configured';
};

export type ScanExtractionResult = ScanExtractionSuccess | ScanExtractionNotConfigured;

export function isExtractionConfigured(): boolean {
  return process.env.SCAN_IMPORT_PROVIDER === 'mock';
}

export async function extractScanRows(file: File): Promise<ScanExtractionResult> {
  if (!isExtractionConfigured()) {
    return { configured: false, reason: 'extraction_not_configured' };
  }

  const text = await file.text().catch(() => '');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length === 0) {
    return {
      configured: true,
      rows: [{
        date: null,
        registration_number: '',
        start_time: null,
        end_time: null,
        lunch_hours: 0,
        unproductive_hours: 0,
        breakdown_hours: 0,
        remarks: 'No parseable content in mock scan input',
        extraction_confidence: 0.1
      }]
    };
  }

  return {
    configured: true,
    rows: lines.map((line, index) => ({
      date: '2026-05-06',
      registration_number: line,
      start_time: '08:00',
      end_time: '17:00',
      lunch_hours: 1,
      unproductive_hours: 0,
      breakdown_hours: 0,
      remarks: `Mock extracted line ${index + 1}`,
      extraction_confidence: 0.95
    }))
  };
}

export function buildScanReviewRows(
  extractedRows: ScanExtractionItem[],
  plants: Array<{ id: string; registration_number: string }>,
  existingLogs: Array<{ id: string; plant_id: string; date: string }>,
  confidenceThreshold = 0.8
): ImportReviewRow[] {
  const baseRows = buildImportReviewRows(extractedRows, plants, existingLogs);

  return baseRows.map((row, index) => {
    const confidence = Number(extractedRows[index]?.extraction_confidence ?? 0);
    const requiresReview = !Number.isFinite(confidence) || confidence < confidenceThreshold;

    return {
      ...row,
      parsed_data: {
        ...row.parsed_data,
        extraction_confidence: Number.isFinite(confidence) ? confidence : 0,
        requires_review: requiresReview
      }
    };
  });
}
