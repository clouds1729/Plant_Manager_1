import { describe, expect, it } from 'vitest';
import { buildCreatePayload, buildPlantLogCreatePayload } from '@/lib/crud';

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

describe('buildPlantLogCreatePayload', () => {
  it('adds membership org, defaults numeric fields, and draft status', () => {
    expect(buildPlantLogCreatePayload({ plant_id: 'plant-1', project_id: 'project-1', date: '2026-05-01' }, 'org-123')).toMatchObject({
      organization_id: 'org-123',
      lunch_hours: 0,
      unproductive_hours: 0,
      breakdown_hours: 0,
      gross_hours: 0,
      billable_hours: 0,
      approval_status: 'draft'
    });
  });

  it('computes gross and billable from start/end and deductions', () => {
    expect(buildPlantLogCreatePayload({
      start_time: '08:00',
      end_time: '17:00',
      lunch_hours: 1,
      unproductive_hours: 1,
      breakdown_hours: 0.5
    }, 'org-123')).toMatchObject({
      gross_hours: 9,
      billable_hours: 6.5
    });
  });
});
