'use client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { getCurrentMembership } from '@/lib/membership';
import { buildCreatePayload } from '@/lib/crud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SelectOption = { value: string; label: string };
type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: SelectOption[];
  optionsTable?: string;
  optionLabel?: (row: Record<string, any>) => string;
};

type Props<T extends z.ZodTypeAny> = { table: string; schema: T; fields: FieldConfig[]; title: string };

export function CrudTable<T extends z.ZodTypeAny>({ table, schema, fields, title }: Props<T>) {
  const [rows, setRows] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, SelectOption[]>>({});
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

  const loadOptions = async () => {
    const selectFields = fields.filter((f) => f.type === 'select' && f.optionsTable);
    const results = await Promise.all(selectFields.map(async (field) => {
      const { data, error } = await supabase.from(field.optionsTable as string).select('*').order('created_at', { ascending: false });
      if (error || !data) return [field.name, []] as const;
      return [field.name, data.map((row) => ({ value: row.id, label: field.optionLabel ? field.optionLabel(row) : row.name ?? row.id }))] as const;
    }));
    setDynamicOptions(Object.fromEntries(results));
  };

  useEffect(() => {
    const bootstrap = async () => {
      const membership = await getCurrentMembership();
      const nextOrgId = membership?.organization_id ?? null;
      setOrganizationId(nextOrgId);
      await Promise.all([load(nextOrgId), loadOptions()]);
      setIsBootstrapping(false);
    };
    void bootstrap();
  }, []);

  const onSubmit = async (values: any) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    let payload: Record<string, unknown>;
    try {
      payload = buildCreatePayload(values, organizationId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to build create payload.');
      setIsSubmitting(false);
      return;
    }
    const { error } = await supabase.from(table).insert(payload);
    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }
    reset();
    setSuccessMessage('Record created.');
    await load(organizationId);
    setIsSubmitting(false);
  };

  const remove = async (id: string) => {
    setIsMutating(true);
    setErrorMessage(null);
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) setErrorMessage(error.message);
    else setSuccessMessage('Record deleted.');
    await load();
    setIsMutating(false);
  };

  const update = async (row: any) => {
    const nextName = prompt('Enter new value for first field', row[fields[0].name]);
    if (nextName === null) return;
    setIsMutating(true);
    const { error } = await supabase.from(table).update({ [fields[0].name]: nextName }).eq('id', row.id);
    if (error) setErrorMessage(error.message);
    else setSuccessMessage('Record updated.');
    await load();
    setIsMutating(false);
  };

  const headers = useMemo(() => fields.map((field) => field.label), [fields]);

  return <section className="space-y-4"><h1 className="text-xl font-semibold">{title}</h1>
    <form className="grid grid-cols-2 gap-2" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((f) => <label key={f.name} className='space-y-1 text-sm'><span>{f.label}</span>{f.type === 'select' ? <select className='w-full rounded border p-2' {...register(f.name as any)}><option value=''>Select {f.label}</option>{(f.options ?? dynamicOptions[f.name] ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <Input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'} placeholder={f.label} {...register(f.name as any)} />}</label>)}
      <Button type="submit" disabled={isBootstrapping || isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
    </form>
    {isBootstrapping && <p className='text-sm text-slate-600'>Loading...</p>}
    {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
    {successMessage && <p className='text-sm text-emerald-700'>{successMessage}</p>}
    {isMutating && <p className='text-sm text-slate-600'>Saving changes...</p>}
    <div className='overflow-x-auto rounded border'>
      <table className='w-full text-left text-sm'>
        <thead className='bg-slate-50'><tr>{headers.map((header) => <th key={header} className='px-3 py-2'>{header}</th>)}<th className='px-3 py-2'>Actions</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className='border-t'>{fields.map((f) => <td key={f.name} className='px-3 py-2'>{String(r[f.name] ?? '—')}</td>)}<td className='px-3 py-2'><div className='flex gap-2'><Button type='button' onClick={() => update(r)}>Update</Button><Button type='button' onClick={() => remove(r.id)}>Delete</Button></div></td></tr>)}</tbody>
      </table>
    </div>
  </section>;
}
