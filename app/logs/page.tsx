'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase/client';
import { plantLogSchema } from '@/lib/validations/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { canTransitionApprovalStatus, type ApprovalStatus } from '@/lib/approvals/status';
import { canApproveOrRejectPlantLog, canSubmitPlantLog, type OrgRole } from '@/lib/approvals/roles';
import { getCurrentMembership } from '@/lib/membership';
import { buildPlantLogCreatePayload } from '@/lib/crud';

export default function LogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [plants, setPlants] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(plantLogSchema as any),
    defaultValues: { lunch_hours: 0, unproductive_hours: 0, breakdown_hours: 0 }
  });

  const load = async () => {
    const { data } = await supabase
      .from('plant_logs')
      .select('*')
      .order('date', { ascending: false });

    setRows(data ?? []);
  };

  useEffect(() => {
    load();
    supabase.from('plants').select('id,registration_number,type').then(({data})=>setPlants(data ?? []));
    supabase.from('projects').select('id,name').then(({data})=>setProjects(data ?? []));
    const loadRole = async () => {
      const membership = await getCurrentMembership();
      setOrganizationId(membership?.organization_id ?? null);
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: member } = await supabase.from('organization_members').select('role').eq('user_id', data.user.id).limit(1).maybeSingle();
      setRole((member?.role as OrgRole | undefined) ?? null);
    };
    void loadRole();
  }, []);

  const transition = async (logId: string, action: 'submit' | 'approve' | 'reject') => {
    const fn = action === 'submit'
      ? 'submit_plant_log'
      : action === 'approve'
        ? 'approve_plant_log'
        : 'reject_plant_log';

    await supabase.rpc(fn, { log_id: logId, notes: null });
    await load();
  };

  const onSubmit = async (v: any) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    if (!organizationId) {
      setErrorMessage('No active organization membership found.');
      setIsSubmitting(false);
      return;
    }

    const payload = buildPlantLogCreatePayload(v, organizationId);
    const { error } = await supabase.from('plant_logs').insert(payload);
    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }
    reset();
    setSuccessMessage('Daily log created.');
    await load();
    setIsSubmitting(false);
  };

  return (
    <section className='space-y-4'>
      <h1 className='text-xl font-semibold'>Daily Logs</h1>

      <form className='grid grid-cols-2 gap-2' onSubmit={handleSubmit(onSubmit)}>
        <label className='space-y-1 text-sm'>
          <span>Plant</span>
          <select className='w-full rounded border p-2' {...register('plant_id')}><option value=''>Select plant</option>{plants.map((p)=><option key={p.id} value={p.id}>{p.registration_number} ({p.type ?? 'plant'})</option>)}</select>
        </label>
        <label className='space-y-1 text-sm'>
          <span>Project</span>
          <select className='w-full rounded border p-2' {...register('project_id')}><option value=''>Select project</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name ?? p.id}</option>)}</select>
        </label>
        <label className='space-y-1 text-sm'>
          <span>Date</span>
          <Input type='date' placeholder='Date' {...register('date')} />
        </label>
        <label className='space-y-1 text-sm'>
          <span>Start time</span>
          <Input type='time' placeholder='Start time' {...register('start_time')} />
        </label>
        <label className='space-y-1 text-sm'>
          <span>End time</span>
          <Input type='time' placeholder='End time' {...register('end_time')} />
        </label>
        <label className='space-y-1 text-sm'>
          <span>Lunch hours</span>
          <Input type='number' step='0.25' placeholder='Lunch hours' {...register('lunch_hours', { valueAsNumber: true })} />
        </label>
        <label className='space-y-1 text-sm'>
          <span>Unproductive hours</span>
          <Input type='number' step='0.25' placeholder='Unproductive hours' {...register('unproductive_hours', { valueAsNumber: true })} />
        </label>
        <label className='space-y-1 text-sm'>
          <span>Breakdown hours</span>
          <Input type='number' step='0.25' placeholder='Breakdown hours' {...register('breakdown_hours', { valueAsNumber: true })} />
        </label>
        <label className='space-y-1 text-sm col-span-2'>
          <span>Remarks</span>
          <Input placeholder='Remarks' {...register('remarks')} />
        </label>
        <Button type='submit' disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
      </form>
      {errorMessage && <p role='alert' className='text-sm text-red-600'>{errorMessage}</p>}
      {successMessage && <p className='text-sm text-emerald-700'>{successMessage}</p>}

      <div>
        {rows.map((row) => {
          const status = (row.approval_status ?? 'draft') as ApprovalStatus;

          return (
            <div key={row.id} className='mb-2 rounded border p-2 text-sm'>
              <div>{row.date}: {row.billable_hours}h billable</div>
              <div>
                Status: <span className='font-medium'>{status}</span>
              </div>
              <div className='mt-2 flex gap-2'>
                {canTransitionApprovalStatus(status, 'submitted') && role !== null && canSubmitPlantLog(role) && (
                  <Button type='button' onClick={() => transition(row.id, 'submit')}>Submit</Button>
                )}
                {canTransitionApprovalStatus(status, 'approved') && role !== null && canApproveOrRejectPlantLog(role) && (
                  <Button type='button' onClick={() => transition(row.id, 'approve')}>Approve</Button>
                )}
                {canTransitionApprovalStatus(status, 'rejected') && role !== null && canApproveOrRejectPlantLog(role) && (
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
