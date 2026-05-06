import { describe, expect, it } from 'vitest';
import { buildCreatePayload } from '@/lib/crud';

describe('buildCreatePayload', () => {
  it('injects organization_id from membership context', () => {
    expect(buildCreatePayload({ name: 'Project A', location: 'NY' }, 'org-123')).toEqual({
      name: 'Project A',
      location: 'NY',
      organization_id: 'org-123'
    });
  });

  it('throws when membership org is missing', () => {
    expect(() => buildCreatePayload({ name: 'Project A' }, null)).toThrow('No active organization membership found.');
  });
});
