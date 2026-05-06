'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildIpcPreview } from '@/lib/calculations/ipc';

export default function IpcPreviewPage() {
  const [result, setResult] = useState<any>(null);

  const runExample = () => {
    const preview = buildIpcPreview({
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      selectedPlantIds: ['00000000-0000-0000-0000-000000000001'],
      logs: [{ id: 'log-1', plant_id: '00000000-0000-0000-0000-000000000001', date: '2026-05-10', billable_hours: 8 }],
      rates: [{ plant_id: '00000000-0000-0000-0000-000000000001', rate: 100, unit: 'hour', effective_from: '2026-01-01' }],
      taxPercent: 0
    });
    setResult(preview);
  };

  return <section className='space-y-3'><h1 className='text-xl font-semibold'>IPC Preview</h1><p className='text-sm text-slate-600'>Foundation preview for supplier/project/period/selected plants IPC calculation and missing-rate validation.</p><div className='flex gap-2'><Input readOnly value='Use IPC periods and selected plants to generate line items.' /><Button type='button' onClick={runExample}>Run Sample Preview</Button></div>{result ? <pre className='rounded border p-3 text-xs'>{JSON.stringify(result, null, 2)}</pre> : null}</section>;
}
