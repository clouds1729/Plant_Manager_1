import type { OrgRole } from '@/lib/approvals/roles';

export const ADMIN_MEMBERSHIP_ROLES: OrgRole[] = ['owner', 'admin'];

export function canManageMembership(role: OrgRole): boolean {
  return ADMIN_MEMBERSHIP_ROLES.includes(role);
}
