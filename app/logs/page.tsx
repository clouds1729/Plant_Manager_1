'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase/client';
import { plantLogSchema } from '@/lib/validations/schemas';
import { calculateBillableHours, calculateGrossHours } from '@/lib/calculations/hours';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(plantLogSchema as any), defaultValues: { lunch_hours: 0, unproductive_hours: 0, breakdown_hours: 0 } });
  const load = async () => { const { data } = await supabase.from('plant_logs').select('*').order('date', { ascending: false }); setRows(data ?? []); };
  useEffect(() => { load(); }, []);
  const onSubmit = async (v: any) => {
    const gross = calculateGrossHours(v.start_time, v.end_time, Number(v.lunch_hours));
    const billable = calculateBillableHours(gross, Number(v.unproductive_hours), Number(v.breakdown_hours));
    await supabase.from('plant_logs').insert({ ...v, gross_hours: gross, billable_hours: billable });
    reset(); load();
  };
  return <section className='space-y-4'><h1 className='text-xl font-semibold'>Daily Logs</h1><form className='grid grid-cols-2 gap-2' onSubmit={handleSubmit(onSubmit)}>
    <Input placeholder='Plant UUID' {...register('plant_id')} /><Input placeholder='Project UUID' {...register('project_id')} />
    <Input type='date' {...register('date')} /><Input type='time' {...register('start_time')} />
    <Input type='time' {...register('end_time')} /><Input type='number' step='0.25' placeholder='Lunch' {...register('lunch_hours', { valueAsNumber: true })} />
    <Input type='number' step='0.25' placeholder='Unproductive' {...register('unproductive_hours', { valueAsNumber: true })} /><Input type='number' step='0.25' placeholder='Breakdown' {...register('breakdown_hours', { valueAsNumber: true })} />
    <Input placeholder='Remarks' {...register('remarks')} />
    <Button type='submit'>Create</Button>
  </form><div>{rows.map((r) => <div key={r.id} className='mb-2 rounded border p-2 text-sm'>{r.date}: {r.billable_hours}h billable</div>)}</div></section>;
}
