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
  return <CrudTable table='plant_rates' schema={rateSchema} title='Plant Rates' fields={[
    { name: 'supplier_id', label: 'Supplier', type:'select', optionsTable:'suppliers', optionLabel:(row)=>row.name ?? row.id },
    { name: 'plant_id', label: 'Plant', type:'select', optionsTable:'plants', optionLabel:(row)=>`${row.registration_number ?? row.id} (${row.type ?? 'plant'})` },
    { name: 'rate', label: 'Rate', type:'number' },
    { name: 'unit', label: 'Unit', type:'select', options:[{value:'hour',label:'hour'},{value:'day',label:'day'},{value:'month',label:'month'},{value:'fixed',label:'fixed'}] },
    { name: 'effective_from', label: 'Effective From', type:'date' },
    { name: 'effective_to', label: 'Effective To', type:'date' }
  ]} />;
}
