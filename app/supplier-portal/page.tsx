'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentMembership } from '@/lib/membership';
import { formatCurrency, formatDate, formatHours } from '@/lib/supplierPortalFormat';

type SupplierMap = { organization_id: string; supplier_id: string };
type SupplierProfile = { id: string; name: string; contact_name: string | null; phone: string | null; email: string | null };
type PlantRow = { id: string; registration_number: string; type: string | null; status: string | null; project_id: string | null };
type RateRow = { id: string; plant_id: string; rate: number; unit: string; effective_from: string; effective_to: string | null };
type IpcPeriodRow = { id: string; ipc_number: string | null; period_start: string; period_end: string; status: string | null; total: number | null };
type IpcLineRow = { id: string; ipc_period_id: string; plant_id: string; hours: number; rate: number; total: number };

export default function SupplierPortalPage() {
  const [loading, setLoading] = useState(true);
  const [accessMissing, setAccessMissing] = useState(false);
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [rates, setRates] = useState<RateRow[]>([]);
  const [periods, setPeriods] = useState<IpcPeriodRow[]>([]);
  const [lines, setLines] = useState<IpcLineRow[]>([]);
  const EMPTY_VALUE = '—';

  useEffect(() => {
    const load = async () => {
      const membership = await getCurrentMembership();
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!membership || !userId) return void (setAccessMissing(true), setLoading(false));

      const { data: supplierMap } = await supabase.from('supplier_users').select('organization_id,supplier_id').eq('organization_id', membership.organization_id).eq('user_id', userId).limit(1).maybeSingle();
      if (!supplierMap) return void (setAccessMissing(true), setLoading(false));
      const map = supplierMap as SupplierMap;

      const [{ data: s }, { data: p }, { data: r }, { data: ip }] = await Promise.all([
        supabase.from('suppliers').select('id,name,contact_name,phone,email').eq('id', map.supplier_id).limit(1).maybeSingle(),
        supabase.from('plants').select('id,registration_number,type,status,project_id').eq('supplier_id', map.supplier_id).order('created_at', { ascending: false }),
        supabase.from('plant_rates').select('id,plant_id,rate,unit,effective_from,effective_to').eq('supplier_id', map.supplier_id).order('effective_from', { ascending: false }),
        supabase.from('ipc_periods').select('id,ipc_number,period_start,period_end,status,total').eq('supplier_id', map.supplier_id).order('period_end', { ascending: false })
      ]);

      const ipcIds = (ip ?? []).map((row) => row.id);
      if (ipcIds.length > 0) {
        const { data: il } = await supabase.from('ipc_lines').select('id,ipc_period_id,plant_id,hours,rate,total').in('ipc_period_id', ipcIds).order('ipc_period_id', { ascending: false });
        setLines((il ?? []) as IpcLineRow[]);
      }

      setSupplier((s as SupplierProfile | null) ?? null);
      setPlants((p ?? []) as PlantRow[]);
      setRates((r ?? []) as RateRow[]);
      setPeriods((ip ?? []) as IpcPeriodRow[]);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) {
    return <main className='text-sm text-slate-500'>Loading supplier portal…</main>;
  }

  if (accessMissing) {
    return <main className='text-sm text-slate-700'>No supplier portal access found.</main>;
  }

  return (
    <main className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Supplier Portal</h1>
        <p className='text-sm text-slate-600'>Read-only supplier-facing view.</p>
      </header>

      <section className='rounded border p-4'>
        <h2 className='font-medium'>Supplier Profile</h2>
        {!supplier ? (
          <p className='mt-2 text-sm text-slate-500'>Supplier profile unavailable.</p>
        ) : (
          <dl className='mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2'>
            <div><dt className='text-slate-500'>Name</dt><dd>{supplier.name}</dd></div>
            <div><dt className='text-slate-500'>Contact</dt><dd>{supplier.contact_name || EMPTY_VALUE}</dd></div>
            <div><dt className='text-slate-500'>Phone</dt><dd>{supplier.phone || EMPTY_VALUE}</dd></div>
            <div><dt className='text-slate-500'>Email</dt><dd>{supplier.email || EMPTY_VALUE}</dd></div>
          </dl>
        )}
      </section>

      <section className='rounded border p-4'>
        <h2 className='font-medium'>Plants</h2>
        {plants.length === 0 ? <p className='mt-2 text-sm text-slate-500'>No plants found.</p> : (
          <div className='mt-3 overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead><tr className='border-b'><th>Registration #</th><th>Type</th><th>Status</th><th>Project ID</th></tr></thead>
              <tbody>{plants.map((row) => <tr key={row.id} className='border-b last:border-b-0'><td className='py-2'>{row.registration_number}</td><td>{row.type || EMPTY_VALUE}</td><td>{row.status || EMPTY_VALUE}</td><td>{row.project_id || EMPTY_VALUE}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className='rounded border p-4'>
        <h2 className='font-medium'>Plant Rates</h2>
        {rates.length === 0 ? <p className='mt-2 text-sm text-slate-500'>No rates found.</p> : (
          <div className='mt-3 overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead><tr className='border-b'><th>Plant ID</th><th>Rate</th><th>Unit</th><th>Effective From</th><th>Effective To</th></tr></thead>
              <tbody>{rates.map((row) => <tr key={row.id} className='border-b last:border-b-0'><td className='py-2'>{row.plant_id}</td><td>{formatCurrency(row.rate)}</td><td>{row.unit}</td><td>{formatDate(row.effective_from)}</td><td>{formatDate(row.effective_to)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className='rounded border p-4'>
        <h2 className='font-medium'>IPC Periods</h2>
        {periods.length === 0 ? <p className='mt-2 text-sm text-slate-500'>No IPC periods found.</p> : (
          <div className='mt-3 overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead><tr className='border-b'><th>IPC #</th><th>Period Start</th><th>Period End</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>{periods.map((row) => <tr key={row.id} className='border-b last:border-b-0'><td className='py-2'>{row.ipc_number || EMPTY_VALUE}</td><td>{formatDate(row.period_start)}</td><td>{formatDate(row.period_end)}</td><td>{row.status || EMPTY_VALUE}</td><td>{formatCurrency(row.total)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className='rounded border p-4'>
        <h2 className='font-medium'>IPC Line Items</h2>
        {lines.length === 0 ? <p className='mt-2 text-sm text-slate-500'>No IPC line items found.</p> : (
          <div className='mt-3 overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead><tr className='border-b'><th>IPC Period ID</th><th>Plant ID</th><th>Hours</th><th>Rate</th><th>Total</th></tr></thead>
              <tbody>{lines.map((row) => <tr key={row.id} className='border-b last:border-b-0'><td className='py-2'>{row.ipc_period_id}</td><td>{row.plant_id}</td><td>{formatHours(row.hours)}</td><td>{formatCurrency(row.rate)}</td><td>{formatCurrency(row.total)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
