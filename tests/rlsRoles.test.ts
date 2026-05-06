import { describe, expect, it } from 'vitest';
import { BUSINESS_WRITE_ROLES, canWriteBusinessTable } from '@/lib/permissions/rls';

describe('business table write role model', () => {
  it('keeps viewer read-only across hardened tables', () => {
    for (const table of Object.keys(BUSINESS_WRITE_ROLES) as Array<keyof typeof BUSINESS_WRITE_ROLES>) {
      expect(canWriteBusinessTable('viewer', table)).toBe(false);
    }
  });

  it('allows finance on rate/import tables but not core setup tables', () => {
    expect(canWriteBusinessTable('finance', 'plant_rates')).toBe(true);
    expect(canWriteBusinessTable('finance', 'imports')).toBe(true);
    expect(canWriteBusinessTable('finance', 'import_rows')).toBe(true);
    expect(canWriteBusinessTable('finance', 'projects')).toBe(false);
    expect(canWriteBusinessTable('finance', 'suppliers')).toBe(false);
    expect(canWriteBusinessTable('finance', 'plants')).toBe(false);
  });
});
