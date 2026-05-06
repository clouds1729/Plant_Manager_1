import { describe, expect, it } from 'vitest';
import { canTransitionApprovalStatus } from '@/lib/approvals/status';

describe('approval status transitions', () => {
  it('allows phase 5 transition rules', () => {
    expect(canTransitionApprovalStatus('draft', 'submitted')).toBe(true);
    expect(canTransitionApprovalStatus('submitted', 'approved')).toBe(true);
    expect(canTransitionApprovalStatus('submitted', 'rejected')).toBe(true);
    expect(canTransitionApprovalStatus('rejected', 'submitted')).toBe(true);
  });

  it('blocks disallowed transitions', () => {
    expect(canTransitionApprovalStatus('draft', 'approved')).toBe(false);
    expect(canTransitionApprovalStatus('draft', 'rejected')).toBe(false);
    expect(canTransitionApprovalStatus('submitted', 'draft')).toBe(false);
    expect(canTransitionApprovalStatus('approved', 'draft')).toBe(false);
    expect(canTransitionApprovalStatus('approved', 'submitted')).toBe(false);
    expect(canTransitionApprovalStatus('approved', 'rejected')).toBe(false);
    expect(canTransitionApprovalStatus('rejected', 'approved')).toBe(false);
  });
});
