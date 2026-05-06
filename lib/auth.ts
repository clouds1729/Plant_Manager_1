import type { OrgRole } from '@/lib/approvals/roles';

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/suppliers',
  '/plants',
  '/logs',
  '/rates',
  '/ipc-periods',
  '/ipc-preview',
  '/imports',
  '/scan-imports'
] as const;

export type Membership = {
  organization_id: string;
  role: OrgRole;
};

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
