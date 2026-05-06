export const ORG_ROLES = ['owner', 'admin', 'finance', 'foreman', 'viewer', 'supplier_viewer'] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export const PLANT_LOG_SUBMIT_ROLES: OrgRole[] = ['foreman', 'admin', 'owner'];
export const PLANT_LOG_APPROVAL_ROLES: OrgRole[] = ['finance', 'admin', 'owner'];
export const IPC_APPROVAL_ROLES: OrgRole[] = ['finance', 'admin', 'owner'];

export function canSubmitPlantLog(role: OrgRole): boolean {
  return PLANT_LOG_SUBMIT_ROLES.includes(role);
}

export function canApproveOrRejectPlantLog(role: OrgRole): boolean {
  return PLANT_LOG_APPROVAL_ROLES.includes(role);
}

export function canSubmitOrApproveOrRejectIpcPeriod(role: OrgRole): boolean {
  return IPC_APPROVAL_ROLES.includes(role);
}
