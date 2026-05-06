import { calculateBillableHours, calculateGrossHours } from '@/lib/calculations/hours';
import { normalizeImportRow, normalizeRegistrationNumber, type NormalizedImportRow } from '@/lib/imports/normalize';

export type ResolutionAction = 'keep_existing' | 'replace_existing' | 'skip_imported' | 'create_flagged_duplicate';
export type ConflictStatus = 'none' | 'conflict';

export type ImportReviewRow = {
  raw_data: Record<string, unknown>;
  parsed_data: NormalizedImportRow;
  plant_match_id: string | null;
  validation_status: 'valid' | 'warning' | 'invalid';
  validation_warnings: string[];
  conflict_status: ConflictStatus;
  resolution_action: ResolutionAction | null;
};

export function matchPlantId(plants: Array<{ id: string; registration_number: string }>, registration: string): string | null {
  const normalized = normalizeRegistrationNumber(registration);
  const found = plants.find((p) => normalizeRegistrationNumber(p.registration_number) === normalized);
  return found?.id ?? null;
}

export function buildImportReviewRows(rawRows: Record<string, unknown>[], plants: Array<{ id: string; registration_number: string }>, existingLogs: Array<{ id: string; plant_id: string; date: string }>): ImportReviewRow[] {
  return rawRows.map((raw) => {
    const parsed = normalizeImportRow(raw);
    const warnings: string[] = [];
    if (!parsed.date) warnings.push('Missing/invalid date');
    if (!parsed.registration_number) warnings.push('Missing registration number');

    const plantId = parsed.registration_number ? matchPlantId(plants, parsed.registration_number) : null;
    if (!plantId) warnings.push('No matching plant');

    const hasConflict = !!(plantId && parsed.date && existingLogs.some((l) => l.plant_id === plantId && l.date === parsed.date));

    return {
      raw_data: raw,
      parsed_data: parsed,
      plant_match_id: plantId,
      validation_status: warnings.length === 0 ? 'valid' : warnings.some((w) => w.includes('Missing')) ? 'invalid' : 'warning',
      validation_warnings: warnings,
      conflict_status: hasConflict ? 'conflict' : 'none',
      resolution_action: hasConflict ? 'keep_existing' : null
    };
  });
}

export function preparePlantLogPayload(row: ImportReviewRow, projectId: string) {
  const p = row.parsed_data;
  const gross = calculateGrossHours(p.start_time, p.end_time, p.lunch_hours);
  const billable = calculateBillableHours(gross, p.unproductive_hours, p.breakdown_hours);
  return {
    project_id: projectId,
    plant_id: row.plant_match_id,
    date: p.date,
    start_time: p.start_time,
    end_time: p.end_time,
    lunch_hours: p.lunch_hours,
    unproductive_hours: p.unproductive_hours,
    breakdown_hours: p.breakdown_hours,
    billable_hours: billable,
    remarks: p.remarks,
    source: 'excel' as const
  };
}
