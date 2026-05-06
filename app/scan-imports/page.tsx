'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildScanReviewRows } from '@/lib/imports/scan';
import { isImportCommitSummary } from '@/lib/imports/commit';
import type { ImportReviewRow, ResolutionAction } from '@/lib/imports/workflow';

type StagedRow = ImportReviewRow & { id: string; requires_review?: boolean; extraction_confidence?: number | null };

export default function ScanImportsPage() { /* omitted for brevity */
  const [organizationId, setOrganizationId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [importId, setImportId] = useState<string | null>(null);
  const [rows, setRows] = useState<StagedRow[]>([]);

  const parseScan = async (file?: File) => {
    if (!file || !projectId || !organizationId) return;
    const formData = new FormData();
    formData.append('file', file);
    const extractionResponse = await fetch('/api/scan-import', { method: 'POST', body: formData });
    const extractionPayload = await extractionResponse.json();
    if (!extractionResponse.ok) return alert(extractionPayload.reason ?? 'Scan extraction failed.');
    const { data: plants } = await supabase.from('plants').select('id,registration_number');
    const { data: logs } = await supabase.from('plant_logs').select('id,plant_id,date');
    const reviewRows = buildScanReviewRows(extractionPayload.rows ?? [], plants ?? [], logs ?? []);
    const { data: createdImport, error: importError } = await supabase.from('imports').insert({ organization_id: organizationId, project_id: projectId, source_type: 'scan', file_name: file.name, status: 'parsed' }).select('id').single();
    if (importError || !createdImport) return alert(importError?.message ?? 'Failed to create scan import record.');
    const { data: stagedRows, error: rowsError } = await supabase.from('import_rows').insert(reviewRows.map((row) => ({ import_id: createdImport.id, raw_data: row.raw_data, parsed_data: row.parsed_data, plant_match_id: row.plant_match_id, validation_status: row.validation_status, conflict_status: row.conflict_status, resolution_action: row.resolution_action, extraction_confidence: row.parsed_data.extraction_confidence ?? null, requires_review: row.parsed_data.requires_review ?? false }))).select('id,raw_data,parsed_data,plant_match_id,validation_status,conflict_status,resolution_action,requires_review,extraction_confidence');
    if (rowsError) return alert(rowsError.message);
    setImportId(createdImport.id);
    setRows((stagedRows ?? []).map((row) => ({ ...row, validation_warnings: [], parsed_data: { ...row.parsed_data, requires_review: row.requires_review ?? row.parsed_data.requires_review ?? false, extraction_confidence: row.extraction_confidence ?? row.parsed_data.extraction_confidence } })) as StagedRow[]);
  };

  const updateAction = async (rowId: string, resolution: ResolutionAction) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, resolution_action: resolution } : r)));
    await supabase.from('import_rows').update({ resolution_action: resolution }).eq('id', rowId);
  };


  const markReviewed = async (rowId: string) => {
    const { error } = await supabase.from('import_rows').update({ requires_review: false }).eq('id', rowId);
    if (error) return alert(error.message);
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, requires_review: false, parsed_data: { ...r.parsed_data, requires_review: false } } : r)));
  };

  const commit = async () => {
    if (!importId) return;
    const { data, error } = await supabase.rpc('commit_import_rows', { p_import_id: importId });
    if (error) return alert(error.message);
    const summary = Array.isArray(data) ? data[0] : data;
    if (!isImportCommitSummary(summary)) return alert('Scan import committed, but summary payload was malformed.');
    alert(`Scan import commit complete. Inserted: ${summary.inserted_count}, updated: ${summary.updated_count}, skipped: ${summary.skipped_count}.`);
  };

  return <section className='space-y-4'>
    <h1 className='text-xl font-semibold'>Scan Imports</h1>
    <Input placeholder='Organization UUID' value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} />
    <Input placeholder='Project UUID' value={projectId} onChange={(e) => setProjectId(e.target.value)} />
    <Input type='file' accept='image/*,.pdf,.txt' onChange={(e) => parseScan(e.target.files?.[0])} />
    <div className='space-y-2'>{rows.map((row) => <div key={row.id} className='rounded border p-3 text-sm space-y-2'><div><strong>{row.parsed_data.registration_number || 'UNKNOWN'}</strong> | date: {row.parsed_data.date ?? 'invalid'} | confidence: {String(row.parsed_data.extraction_confidence ?? 'n/a')}</div><div>requires_review: {String(row.parsed_data.requires_review ?? false)}</div>{row.parsed_data.requires_review ? <Button type='button' onClick={() => markReviewed(row.id)}>Mark reviewed</Button> : null}<div>conflict: {row.conflict_status}</div>{row.conflict_status === 'conflict' ? <select value={row.resolution_action ?? 'keep_existing'} onChange={(e) => updateAction(row.id, e.target.value as ResolutionAction)}><option value='keep_existing'>keep_existing</option><option value='replace_existing'>replace_existing</option><option value='skip_imported'>skip_imported</option><option value='create_flagged_duplicate'>create_flagged_duplicate (not yet supported)</option></select> : null}</div>)}</div>
    <Button onClick={commit} disabled={!projectId || !importId || rows.length === 0}>Commit reviewed rows</Button>
  </section>;
}
