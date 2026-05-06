import { calculateGrossHours } from '@/lib/calculations/hours';

export function buildCreatePayload(values: Record<string, unknown>, organizationId: string | null): Record<string, unknown> {
  if (!organizationId) {
    throw new Error('No active organization membership found.');
  }
  return {
    ...values,
    organization_id: organizationId
  };
}

const toNumberOrDefault = (value: unknown, defaultValue = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

export function buildPlantLogCreatePayload(values: Record<string, unknown>, organizationId: string | null): Record<string, unknown> {
  if (!organizationId) {
    throw new Error('No active organization membership found.');
  }

  const lunchHours = toNumberOrDefault(values.lunch_hours, 0);
  const unproductiveHours = toNumberOrDefault(values.unproductive_hours, 0);
  const breakdownHours = toNumberOrDefault(values.breakdown_hours, 0);

  const startTime = typeof values.start_time === 'string' ? values.start_time : undefined;
  const endTime = typeof values.end_time === 'string' ? values.end_time : undefined;
  const grossFromRange = startTime && endTime
    ? calculateGrossHours(startTime, endTime, 0)
    : null;

  const grossHours = grossFromRange !== null
    ? Math.max(0, grossFromRange)
    : toNumberOrDefault(values.gross_hours, 0);

  const billableHours = Math.max(0, Number((grossHours - lunchHours - unproductiveHours - breakdownHours).toFixed(2)));

  return {
    ...values,
    organization_id: organizationId,
    lunch_hours: lunchHours,
    unproductive_hours: unproductiveHours,
    breakdown_hours: breakdownHours,
    gross_hours: grossHours,
    billable_hours: billableHours,
    approval_status: (values.approval_status as string | undefined) ?? 'draft'
  };
}
