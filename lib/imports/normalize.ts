export type NormalizedImportRow = {
  extraction_confidence?: number;
  requires_review?: boolean;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  registration_number: string;
  lunch_hours: number;
  unproductive_hours: number;
  breakdown_hours: number;
  gross_hours: number;
  billable_hours: number;
  remarks: string;
};

const EMPTY_TIME_VALUES = new Set(['', '-', 'na', 'n/a', 'null']);

export function normalizeRegistrationNumber(input: unknown): string {
  return String(input ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function normalizeRemarks(input: unknown): string {
  return String(input ?? '').trim().replace(/\s+/g, ' ');
}
export function normalizeNumber(input: unknown): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const asNumber = Number(String(input ?? '').trim());
  return Number.isFinite(asNumber) && asNumber >= 0 ? Number(asNumber.toFixed(2)) : 0;
}
export function normalizeDate(input: unknown): string | null {
  if (input == null || input === '') return null;
  if (typeof input === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + input);
    return epoch.toISOString().slice(0, 10);
  }
  const raw = String(input).trim();
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}
export function normalizeTime(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input === 'number') {
    const totalMinutes = Math.round(input * 24 * 60);
    const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const raw = String(input).trim().toLowerCase();
  if (EMPTY_TIME_VALUES.has(raw)) return null;
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] ?? '0');
  const meridiem = m[3];
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
export function normalizeImportRow(raw: Record<string, unknown>): NormalizedImportRow {
  return {
    date: normalizeDate(raw.date),
    start_time: normalizeTime(raw.start_time),
    end_time: normalizeTime(raw.end_time),
    registration_number: normalizeRegistrationNumber(raw.registration_number),
    lunch_hours: normalizeNumber(raw.lunch_hours),
    unproductive_hours: normalizeNumber(raw.unproductive_hours),
    breakdown_hours: normalizeNumber(raw.breakdown_hours),
    gross_hours: 0,
    billable_hours: 0,
    remarks: normalizeRemarks(raw.remarks)
  };
}
