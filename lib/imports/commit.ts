export type ImportCommitSummary = {
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
};

export function isImportCommitSummary(value: unknown): value is ImportCommitSummary {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.inserted_count === 'number'
    && typeof v.updated_count === 'number'
    && typeof v.skipped_count === 'number';
}
