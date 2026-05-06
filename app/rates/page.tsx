'use client';
import { CrudTable } from '@/components/crud-table';
import { z } from 'zod';

const rateSchema = z.object({
  supplier_id: z.string().uuid(),
  plant_id: z.string().uuid(),
  rate: z.coerce.number().min(0),
  unit: z.enum(['hour', 'day', 'month', 'fixed']).default('hour'),
  effective_from: z.string(),
  effective_to: z.string().optional()
});

export default function RatesPage() {
  return <CrudTable table='plant_rates' schema={rateSchema} title='Plant Rates' fields={[{ name: 'supplier_id', label: 'Supplier UUID' }, { name: 'plant_id', label: 'Plant UUID' }, { name: 'rate', label: 'Rate' }, { name: 'unit', label: 'Unit' }, { name: 'effective_from', label: 'Effective From' }, { name: 'effective_to', label: 'Effective To' }]} />;
}
