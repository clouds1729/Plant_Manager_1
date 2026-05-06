export function buildCreatePayload(values: Record<string, unknown>, organizationId: string | null): Record<string, unknown> {
  if (!organizationId) {
    throw new Error('No active organization membership found.');
  }
  return {
    ...values,
    organization_id: organizationId
  };
}
