'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { buildIpcPreview, PlantLogForIpc } from '@/lib/calculations/ipc';
import { buildFinalizeIpcPayload } from '@/lib/calculations/ipcFinalize';
import { PlantRate } from '@/lib/calculations/rates';
import { getCurrentMembership } from '@/lib/membership';
import { createActivityEvent } from '@/lib/activity';

type Option = {
  id: string;
  name?: string | null;
  registration_number?: string | null;
  project_id?: string;
  supplier_id?: string;
};

export default function IpcPreviewPage() {
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [plants, setPlants] = useState<Option[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [taxPercent, setTaxPercent] = useState(0);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);

  const [result, setResult] = useState<ReturnType<typeof buildIpcPreview> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      const membership = await getCurrentMembership();
      setOrganizationId(membership?.organization_id ?? null);

      const [suppliersRes, projectsRes, plantsRes] = await Promise.all([
        supabase.from('suppliers').select('id,name').order('name'),
        supabase.from('projects').select('id,name').order('name'),
        supabase.from('plants').select('id,registration_number,project_id,supplier_id').order('registration_number')
      ]);

      if (suppliersRes.data) setSuppliers(suppliersRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (plantsRes.data) setPlants(plantsRes.data);
    };
    void loadOptions();
  }, []);

  const filteredPlants = useMemo(
    () => plants.filter((p) => (!supplierId || p.supplier_id === supplierId) && (!projectId || p.project_id === projectId)),
    [plants, projectId, supplierId]
  );

  useEffect(() => {
    setSelectedPlantIds((prev) => prev.filter((id) => filteredPlants.some((p) => p.id === id)));
  }, [filteredPlants]);

  const runPreview = async () => {
    setError(null);
    setResult(null);
    if (!supplierId || !projectId || !periodStart || !periodEnd || selectedPlantIds.length === 0) {
      setError('Please select supplier, project, period, and at least one plant.');
      return;
    }

    setIsLoading(true);
    try {
      const [{ data: logs, error: logsError }, { data: rates, error: ratesError }] = await Promise.all([
        supabase
          .from('plant_logs')
          .select('id,plant_id,date,billable_hours,ipc_period_id')
          .eq('project_id', projectId)
          .in('plant_id', selectedPlantIds)
          .gte('date', periodStart)
          .lte('date', periodEnd)
          .is('ipc_period_id', null),
        supabase
          .from('plant_rates')
          .select('plant_id,rate,unit,effective_from,effective_to')
          .eq('supplier_id', supplierId)
      ]);

      if (logsError) throw logsError;
      if (ratesError) throw ratesError;

      const preview = buildIpcPreview({
        logs: (logs ?? []) as PlantLogForIpc[],
        rates: (rates ?? []) as PlantRate[],
        selectedPlantIds,
        periodStart,
        periodEnd,
        taxPercent
      });
      setResult(preview);
    } catch (e: any) {
      setError(e.message ?? 'Failed to run preview');
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeIpc = async () => {
    if (!result || !result.canFinalize) return;
    setIsFinalizing(true);
    setError(null);

    try {
      const payload = buildFinalizeIpcPayload({
        project_id: projectId,
        supplier_id: supplierId,
        period_start: periodStart,
        period_end: periodEnd,
        selected_plant_ids: selectedPlantIds,
        tax_percent: taxPercent,
        lines: result.lines
      });

      const { data, error } = await supabase.rpc('finalize_ipc_period', payload);
      if (error) throw error;

      const finalizedPeriodId = Array.isArray(data) ? data[0]?.id ?? null : null;
      if (organizationId) {
        await createActivityEvent({
          organizationId,
          eventType: 'ipc_finalized',
          entityType: 'ipc_period',
          entityId: finalizedPeriodId,
          message: 'IPC finalized'
        });
      }

      await runPreview();
    } catch (e: any) {
      setError(e.message ?? 'Failed to finalize IPC');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <section className='space-y-4'>
      <h1 className='text-xl font-semibold'>IPC Preview</h1>
      <p className='text-sm text-slate-600'>Generate IPC preview from real Supabase logs/rates for selected supplier, project, period, and plants.</p>

      <div className='grid gap-3 md:grid-cols-2'>
        <label className='text-sm'>Supplier
          <select className='mt-1 w-full rounded border p-2' value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value=''>Select supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.id}</option>)}
          </select>
        </label>
        <label className='text-sm'>Project
          <select className='mt-1 w-full rounded border p-2' value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value=''>Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name ?? p.id}</option>)}
          </select>
        </label>
        <label className='text-sm'>Period start<Input type='date' value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></label>
        <label className='text-sm'>Period end<Input type='date' value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></label>
        <label className='text-sm'>Tax percent<Input type='number' value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} /></label>
      </div>

      <div className='space-y-2'>
        <h2 className='font-medium'>Select plants</h2>
        <div className='grid gap-2 md:grid-cols-2'>
          {filteredPlants.map((plant) => <label key={plant.id} className='flex items-center gap-2 text-sm'><input type='checkbox' checked={selectedPlantIds.includes(plant.id)} onChange={(e) =>
                setSelectedPlantIds((prev) =>
                  e.target.checked ? [...prev, plant.id] : prev.filter((id) => id !== plant.id)
                )
              } />{plant.registration_number ?? plant.id}</label>)}
        </div>
      </div>

      <div className='flex gap-2'>
        <Button type='button' onClick={runPreview} disabled={isLoading}>{isLoading ? 'Loading...' : 'Run IPC Preview'}</Button>
        <Button type='button' onClick={finalizeIpc} disabled={!result?.canFinalize || isFinalizing}>{isFinalizing ? 'Finalizing...' : 'Finalize IPC'}</Button>
      </div>

      {error ? <p className='text-sm text-red-600'>{error}</p> : null}
      {result ? <div className='space-y-2 text-sm'>
        <p>Line items: {result.lines.length}</p>
        <p>Subtotal: {result.subtotal.toFixed(2)}</p>
        <p>Tax total: {result.taxTotal.toFixed(2)}</p>
        <p>Total: {result.total.toFixed(2)}</p>
        {result.missingRateLogIds.length > 0 ? <p className='text-amber-600'>Missing rate log IDs: {result.missingRateLogIds.join(', ')}</p> : <p className='text-green-700'>No missing rates. Safe to finalize.</p>}
        <pre className='rounded border p-3 text-xs'>{JSON.stringify(result.lines, null, 2)}</pre>
      </div> : null}
    </section>
  );
}
