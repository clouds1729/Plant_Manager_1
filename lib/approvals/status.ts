export const APPROVAL_STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'rejected'],
  approved: [],
  rejected: ['submitted']
};

export function canTransitionApprovalStatus(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
