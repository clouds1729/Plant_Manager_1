import { describe, expect, it } from 'vitest';
import {
  canApproveOrRejectPlantLog,
  canSubmitOrApproveOrRejectIpcPeriod,
  canSubmitPlantLog,
  ORG_ROLES
} from '@/lib/approvals/roles';

describe('approval role permissions', () => {
  it('matches allowed roles for plant log submission', () => {
    expect(canSubmitPlantLog('foreman')).toBe(true);
    expect(canSubmitPlantLog('admin')).toBe(true);
    expect(canSubmitPlantLog('owner')).toBe(true);
    expect(canSubmitPlantLog('finance')).toBe(false);
    expect(canSubmitPlantLog('viewer')).toBe(false);
  });

  it('matches allowed roles for plant log approval/rejection', () => {
    expect(canApproveOrRejectPlantLog('finance')).toBe(true);
    expect(canApproveOrRejectPlantLog('admin')).toBe(true);
    expect(canApproveOrRejectPlantLog('owner')).toBe(true);
    expect(canApproveOrRejectPlantLog('foreman')).toBe(false);
    expect(canApproveOrRejectPlantLog('viewer')).toBe(false);
  });

  it('matches allowed roles for IPC submit/approval/rejection', () => {
    expect(canSubmitOrApproveOrRejectIpcPeriod('finance')).toBe(true);
    expect(canSubmitOrApproveOrRejectIpcPeriod('admin')).toBe(true);
    expect(canSubmitOrApproveOrRejectIpcPeriod('owner')).toBe(true);
    expect(canSubmitOrApproveOrRejectIpcPeriod('foreman')).toBe(false);
    expect(canSubmitOrApproveOrRejectIpcPeriod('viewer')).toBe(false);
  });

  it('keeps phase 5 hardening role set constrained', () => {
    expect(ORG_ROLES).toEqual(['owner', 'admin', 'finance', 'foreman', 'viewer', 'supplier_viewer']);
  });
});
