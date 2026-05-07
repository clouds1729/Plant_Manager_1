import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const migrationSql = readFileSync(
  'supabase/migrations/202605070001_fix_commit_import_rows_plant_logs_schema.sql',
  'utf8'
);

describe('commit_import_rows migration schema alignment', () => {
  it('does not reference removed plant_logs.source column', () => {
    expect(migrationSql).not.toMatch(/\bsource\b/);
  });

  it('writes gross_hours, billable_hours, and approval_status', () => {
    expect(migrationSql).toMatch(/gross_hours/);
    expect(migrationSql).toMatch(/billable_hours/);
    expect(migrationSql).toMatch(/approval_status/);
  });
});
