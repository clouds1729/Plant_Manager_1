'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { getCurrentMembership } from '@/lib/membership';
import { buildCreatePayload } from '@/lib/crud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props<T extends z.ZodTypeAny> = { table: string; schema: T; fields: Array<{name: string; label: string}>; title: string };

export function CrudTable<T extends z.ZodTypeAny>({ table, schema, fields, title }: Props<T>) {
  const [rows, setRows] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<any>({ resolver: zodResolver(schema as any) });

  const load = async (orgId?: string | null) => {
    const scopedOrgId = orgId ?? organizationId;
    let query = supabase.from(table).select('*').order('created_at', { ascending: false });
    if (scopedOrgId) query = query.eq('organization_id', scopedOrgId);
    const { data, error } = await query;
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setRows(data ?? []);
  };
  useEffect(() => {
    const bootstrap = async () => {
      const membership = await getCurrentMembership();
      const nextOrgId = membership?.organization_id ?? null;
      setOrganizationId(nextOrgId);
      await load(nextOrgId);
      setIsBootstrapping(false);
    };
    void bootstrap();
  }, []);

  const onSubmit = async (values: any) => {
    setErrorMessage(null);
    let payload: Record<string, unknown>;
    try {
      payload = buildCreatePayload(values, organizationId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to build create payload.');
      return;
    }
    const { error } = await supabase.from(table).insert(payload);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    reset();
    await load(organizationId);
  };
  const remove = async (id: string) => { await supabase.from(table).delete().eq('id', id); load(); };
  const update = async (row: any) => {
    const nextName = prompt('Enter new value for first field', row[fields[0].name]);
    if (nextName === null) return;
    await supabase.from(table).update({ [fields[0].name]: nextName }).eq('id', row.id);
    load();
  };

  return <section className="space-y-4"><h1 className="text-xl font-semibold">{title}</h1>
    <form className="grid grid-cols-2 gap-2" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((f) => <Input key={f.name} placeholder={f.label} {...register(f.name as any)} />)}
      <Button type="submit" disabled={isBootstrapping}>Create</Button>
    </form>
    {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
    <div className="space-y-2">{rows.map((r) => <div key={r.id} className="flex items-center justify-between rounded border p-2 text-sm"><pre>{JSON.stringify(r)}</pre><div className='flex gap-2'><Button type='button' onClick={() => update(r)}>Update</Button><Button type='button' onClick={() => remove(r.id)}>Delete</Button></div></div>)}</div>
  </section>;
}
