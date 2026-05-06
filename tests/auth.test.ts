import { describe, expect, it } from 'vitest';
import { isProtectedPath, PROTECTED_ROUTES } from '@/lib/auth';

describe('auth route gating helpers', () => {
  it('includes required protected routes', () => {
    expect(PROTECTED_ROUTES).toEqual([
      '/dashboard',
      '/projects',
      '/suppliers',
      '/plants',
      '/logs',
      '/rates',
      '/ipc-periods',
      '/ipc-preview',
      '/imports',
      '/scan-imports',
      '/settings/members',
      '/supplier-portal'
    ]);
  });

  it('matches exact and nested protected paths', () => {
    expect(isProtectedPath('/dashboard')).toBe(true);
    expect(isProtectedPath('/projects/123')).toBe(true);
    expect(isProtectedPath('/settings/members')).toBe(true);
    expect(isProtectedPath('/supplier-portal')).toBe(true);
    expect(isProtectedPath('/login')).toBe(false);
    expect(isProtectedPath('/')).toBe(false);
  });
});
