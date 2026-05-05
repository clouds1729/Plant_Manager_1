import { z } from 'zod';

export const projectSchema = z.object({ name: z.string().min(1), location: z.string().optional() });
export const supplierSchema = z.object({ name: z.string().min(1), contact_name: z.string().optional() });
export const plantSchema = z.object({ registration_number: z.string().min(1), type: z.string().min(1), project_id: z.string().uuid(), supplier_id: z.string().uuid() });
export const plantLogSchema = z.object({
  plant_id: z.string().uuid(),
  project_id: z.string().uuid(),
  date: z.string(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  lunch_hours: z.number().min(0).default(0),
  unproductive_hours: z.number().min(0).default(0),
  breakdown_hours: z.number().min(0).default(0),
  remarks: z.string().optional()
});
