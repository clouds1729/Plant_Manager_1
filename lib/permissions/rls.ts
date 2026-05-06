import type { OrgRole } from '@/lib/approvals/roles';

export const BUSINESS_WRITE_ROLES: Record<string, OrgRole[]> = {
  projects: ['admin', 'owner'],
  suppliers: ['admin', 'owner'],
  plants: ['admin', 'owner'],
  plant_rates: ['finance', 'admin', 'owner'],
  imports: ['finance', 'admin', 'owner'],
  import_rows: ['finance', 'admin', 'owner']
};

export function canWriteBusinessTable(role: OrgRole, table: keyof typeof BUSINESS_WRITE_ROLES): boolean {
  return BUSINESS_WRITE_ROLES[table].includes(role);
}
