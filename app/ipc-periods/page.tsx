'use client';
import { CrudTable } from '@/components/crud-table';
import { z } from 'zod';

const ipcPeriodSchema = z.object({
  project_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  status: z.enum(['draft', 'finalized']).default('draft')
});

export default function IpcPeriodsPage() {
  return <CrudTable table='ipc_periods' schema={ipcPeriodSchema} title='IPC Periods' fields={[{ name: 'project_id', label: 'Project UUID' }, { name: 'supplier_id', label: 'Supplier UUID' }, { name: 'period_start', label: 'Period Start' }, { name: 'period_end', label: 'Period End' }, { name: 'status', label: 'Status' }]} />;
}
