'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { CrudTable } from '@/components/crud-table';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { canTransitionApprovalStatus, type ApprovalStatus } from '@/lib/approvals/status';
import { canSubmitOrApproveOrRejectIpcPeriod, type OrgRole } from '@/lib/approvals/roles';

const ipcPeriodSchema = z.object({
  project_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  status: z.enum(['draft', 'finalized']).default('draft')
});

export default function IpcPeriodsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [role, setRole] = useState<OrgRole | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('ipc_periods')
      .select('id,period_start,period_end,approval_status')
      .order('created_at', { ascending: false });

    setRows(data ?? []);
  };

  useEffect(() => {
    load();
    const loadRole = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: member } = await supabase.from('organization_members').select('role').eq('user_id', data.user.id).limit(1).maybeSingle();
      setRole((member?.role as OrgRole | undefined) ?? null);
    };
    void loadRole();
  }, []);

  const transition = async (ipcPeriodId: string, action: 'submit' | 'approve' | 'reject') => {
    const fn = action === 'submit'
      ? 'submit_ipc_period'
      : action === 'approve'
        ? 'approve_ipc_period'
        : 'reject_ipc_period';

    await supabase.rpc(fn, { ipc_period_id: ipcPeriodId, notes: null });
    await load();
  };

  return (
    <section className='space-y-6'>
      <CrudTable
        table='ipc_periods'
        schema={ipcPeriodSchema}
        title='IPC Periods'
        fields={[
          { name: 'project_id', label: 'Project', type:'select', optionsTable:'projects', optionLabel:(row)=>row.name ?? row.id },
          { name: 'supplier_id', label: 'Supplier', type:'select', optionsTable:'suppliers', optionLabel:(row)=>row.name ?? row.id },
          { name: 'period_start', label: 'Period Start', type:'date' },
          { name: 'period_end', label: 'Period End', type:'date' },
          { name: 'status', label: 'Status', type:'select', options:[{value:'draft',label:'draft'},{value:'finalized',label:'finalized'}] }
        ]}
      />

      <div className='space-y-2'>
        <h2 className='text-lg font-semibold'>Approval Status</h2>

        {rows.map((row) => {
          const status = (row.approval_status ?? 'draft') as ApprovalStatus;

          return (
            <div key={row.id} className='rounded border p-2 text-sm'>
              <div>{row.period_start} to {row.period_end}</div>
              <div>
                Status: <span className='font-medium'>{status}</span>
              </div>
              <div className='mt-2 flex gap-2'>
                {canTransitionApprovalStatus(status, 'submitted') && role !== null && canSubmitOrApproveOrRejectIpcPeriod(role) && (
                  <Button type='button' onClick={() => transition(row.id, 'submit')}>Submit</Button>
                )}
                {canTransitionApprovalStatus(status, 'approved') && role !== null && canSubmitOrApproveOrRejectIpcPeriod(role) && (
                  <Button type='button' onClick={() => transition(row.id, 'approve')}>Approve</Button>
                )}
                {canTransitionApprovalStatus(status, 'rejected') && role !== null && canSubmitOrApproveOrRejectIpcPeriod(role) && (
                  <Button type='button' onClick={() => transition(row.id, 'reject')}>Reject</Button>
                )}
                {role === 'viewer' && <span className='text-slate-500'>Read-only</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
