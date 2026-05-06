import { describe, expect, it } from 'vitest';
import { ADMIN_MEMBERSHIP_ROLES, canManageMembership } from '@/lib/membershipRoles';

describe('membership management role helpers', () => {
  it('only allows owner/admin to manage members', () => {
    expect(canManageMembership('owner')).toBe(true);
    expect(canManageMembership('admin')).toBe(true);
    expect(canManageMembership('finance')).toBe(false);
    expect(canManageMembership('foreman')).toBe(false);
    expect(canManageMembership('viewer')).toBe(false);
  });

  it('keeps admin role list constrained', () => {
    expect(ADMIN_MEMBERSHIP_ROLES).toEqual(['owner', 'admin']);
  });
});
