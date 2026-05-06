'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentMembership } from '@/lib/membership';
import type { OrgRole } from '@/lib/approvals/roles';
import { aggregateIpcLineTotals, buildIpcLinesCsv, type ReportIpcLine } from '@/lib/reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type IpcPeriod = { id: string; project_id: string; supplier_id: string; ipc_number: string | null; period_start: string; period_end: string; status: string | null; subtotal: number | null; tax_total: number | null; total: number | null };

const REPORT_ACCESS_ROLES: OrgRole[] = ['owner', 'admin', 'finance'];

export default function ReportsPage() {
  const [periodId, setPeriodId] = useState('');
  const [role, setRole] = useState<OrgRole | null>(null);
  const [period, setPeriod] = useState<IpcPeriod | null>(null);
  const [lines, setLines] = useState<ReportIpcLine[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadReport = async () => {
    setMessage(null);
    const membership = await getCurrentMembership();
    setRole(membership?.role ?? null);
    if (!membership) return void setMessage('No organization membership found.');

    const cleanedPeriodId = periodId.trim();
    if (!cleanedPeriodId) return void setMessage('Enter an IPC period id.');

    const { data: ipcPeriod } = await supabase.from('ipc_periods').select('id,project_id,supplier_id,ipc_number,period_start,period_end,status,subtotal,tax_total,total').eq('id', cleanedPeriodId).limit(1).maybeSingle();
    if (!ipcPeriod) {
      setPeriod(null);
      setLines([]);
      return void setMessage('IPC period not found or not accessible.');
    }

    const { data: ipcLines } = await supabase.from('ipc_lines').select('id,ipc_period_id,plant_id,hours,rate,subtotal,tax_amount,total').eq('ipc_period_id', cleanedPeriodId).order('created_at', { ascending: true });
    setPeriod(ipcPeriod as IpcPeriod);
    setLines((ipcLines ?? []) as ReportIpcLine[]);
  };

  const exportCsv = () => {
    if (!period) return;
    const totals = aggregateIpcLineTotals(lines);
    const csv = buildIpcLinesCsv(lines, totals);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipc-report-${period.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasReportAccess = role !== null && REPORT_ACCESS_ROLES.includes(role);
  const derivedTotals = aggregateIpcLineTotals(lines);

  return <main className='space-y-6'>
    <header><h1 className='text-2xl font-semibold'>Reports</h1><p className='text-sm text-slate-600'>Internal finance/admin report and export foundation for IPC data.</p></header>
    <section className='space-y-3 rounded border p-4'>
      <label className='text-sm font-medium' htmlFor='period-id'>IPC Period ID</label>
      <div className='flex max-w-2xl gap-2'><Input id='period-id' value={periodId} onChange={(e) => setPeriodId(e.target.value)} placeholder='Enter IPC period UUID' /><Button type='button' onClick={loadReport}>Load</Button></div>
      {message && <p className='text-sm text-slate-600'>{message}</p>}
      {!hasReportAccess && role !== null && <p className='text-sm text-amber-700'>Finance/admin access required for export controls.</p>}
    </section>
    {period && <>
      <section className='rounded border p-4'>
        <h2 className='font-medium'>IPC Period Summary</h2>
        <dl className='mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2'>
          <div><dt className='text-slate-500'>IPC Period ID</dt><dd>{period.id}</dd></div><div><dt className='text-slate-500'>IPC #</dt><dd>{period.ipc_number ?? '—'}</dd></div><div><dt className='text-slate-500'>Project ID</dt><dd>{period.project_id}</dd></div><div><dt className='text-slate-500'>Supplier ID</dt><dd>{period.supplier_id}</dd></div><div><dt className='text-slate-500'>Period Start</dt><dd>{period.period_start}</dd></div><div><dt className='text-slate-500'>Period End</dt><dd>{period.period_end}</dd></div><div><dt className='text-slate-500'>Status</dt><dd>{period.status ?? '—'}</dd></div>
        </dl>
      </section>
      <section className='rounded border p-4'>
        <div className='mb-3 flex items-center justify-between'><h2 className='font-medium'>Line Items</h2>{hasReportAccess && <Button type='button' onClick={exportCsv}>Export CSV</Button>}</div>
        {lines.length === 0 ? <p className='text-sm text-slate-500'>No IPC lines found.</p> : <div className='overflow-x-auto'><table className='w-full text-left text-sm'><thead><tr className='border-b'><th>Plant ID</th><th>Hours</th><th>Rate</th><th>Subtotal</th><th>Tax</th><th>Total</th></tr></thead><tbody>{lines.map((line) => <tr key={line.id} className='border-b last:border-b-0'><td className='py-2'>{line.plant_id}</td><td>{line.hours}</td><td>{line.rate}</td><td>{line.subtotal}</td><td>{line.tax_amount}</td><td>{line.total}</td></tr>)}</tbody></table></div>}
        <div className='mt-4 grid grid-cols-1 gap-1 text-sm sm:grid-cols-3'><div>Subtotal: <span className='font-medium'>{period.subtotal ?? derivedTotals.subtotal}</span></div><div>Tax Total: <span className='font-medium'>{period.tax_total ?? derivedTotals.taxTotal}</span></div><div>Total: <span className='font-medium'>{period.total ?? derivedTotals.total}</span></div></div>
      </section>
    </>}
  </main>;
}
