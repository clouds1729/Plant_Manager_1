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
  const plantsById = new Map(plants.map((plant) => [plant.id, plant]));
  return rawRows.map((raw) => {
    const parsed = normalizeImportRow(raw);
    const gross = calculateGrossHours(parsed.start_time, parsed.end_time, parsed.lunch_hours);
    const billable = calculateBillableHours(gross, parsed.unproductive_hours, parsed.breakdown_hours);
    const parsedWithHours: NormalizedImportRow = { ...parsed, gross_hours: gross, billable_hours: billable };

    const warnings: string[] = [];
    if (!parsed.date) warnings.push('Missing/invalid date');
    if (!parsed.registration_number && !raw.plant_id) warnings.push('Missing registration number or plant_id');

    const plantFromId = typeof raw.plant_id === 'string' && plantsById.has(raw.plant_id) ? raw.plant_id : null;
    const plantId = plantFromId ?? (parsed.registration_number ? matchPlantId(plants, parsed.registration_number) : null);
    if (!plantId) warnings.push('No matching plant');

    const hasConflict = !!(plantId && parsed.date && existingLogs.some((l) => l.plant_id === plantId && l.date === parsed.date));

    return {
      raw_data: raw,
      parsed_data: parsedWithHours,
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

  return {
    project_id: projectId,
    plant_id: row.plant_match_id,
    date: p.date,
    start_time: p.start_time,
    end_time: p.end_time,
    lunch_hours: p.lunch_hours,
    unproductive_hours: p.unproductive_hours,
    breakdown_hours: p.breakdown_hours,
    billable_hours: p.billable_hours,
    remarks: p.remarks,
    source: 'excel' as const
  };
}
