import type { OrgRole } from '@/lib/approvals/roles';

export function isSupplierViewerRole(role: OrgRole | null): boolean {
  return role === 'supplier_viewer';
}
