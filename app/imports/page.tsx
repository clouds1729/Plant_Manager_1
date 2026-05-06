'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildImportReviewRows, type ImportReviewRow, type ResolutionAction } from '@/lib/imports/workflow';
import { isImportCommitSummary } from '@/lib/imports/commit';

type StagedRow = ImportReviewRow & { id: string };

export default function ImportsPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [importId, setImportId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<StagedRow[]>([]);

  const parseFile = async (file?: File) => {
    if (!file || !projectId || !organizationId) return;
    setFileName(file.name);

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: null });

    const { data: plants } = await supabase.from('plants').select('id,registration_number');
    const { data: logs } = await supabase.from('plant_logs').select('id,plant_id,date');
    const reviewRows = buildImportReviewRows(jsonRows, plants ?? [], logs ?? []);

    const { data: createdImport, error: importError } = await supabase
      .from('imports')
      .insert({ organization_id: organizationId, project_id: projectId, source_type: 'excel', file_name: file.name, status: 'parsed' })
      .select('id')
      .single();
    if (importError || !createdImport) {
      alert(importError?.message ?? 'Failed to create import staging record.');
      return;
    }

    const { data: stagedRows, error: rowsError } = await supabase
      .from('import_rows')
      .insert(reviewRows.map((row) => ({
        import_id: createdImport.id,
        raw_data: row.raw_data,
        parsed_data: row.parsed_data,
        plant_match_id: row.plant_match_id,
        validation_status: row.validation_status,
        conflict_status: row.conflict_status,
        resolution_action: row.resolution_action
      })))
      .select('id,raw_data,parsed_data,plant_match_id,validation_status,conflict_status,resolution_action');

    if (rowsError) {
      alert(rowsError.message);
      return;
    }

    setImportId(createdImport.id);
    setRows((stagedRows ?? []).map((row) => ({ ...row, validation_warnings: [] })) as StagedRow[]);
  };

  const updateAction = async (rowId: string, resolution: ResolutionAction) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, resolution_action: resolution } : r)));
    await supabase.from('import_rows').update({ resolution_action: resolution }).eq('id', rowId);
  };

  const commit = async () => {
    if (!importId) return;

    const { data, error } = await supabase.rpc('commit_import_rows', { p_import_id: importId });
    if (error) {
      alert(error.message);
      return;
    }

    const summary = Array.isArray(data) ? data[0] : data;
    if (!isImportCommitSummary(summary)) {
      alert('Import committed, but summary payload was malformed.');
      return;
    }

    alert(`Import commit complete. Inserted: ${summary.inserted_count}, updated: ${summary.updated_count}, skipped: ${summary.skipped_count}.`);
  };

  return <section className='space-y-4'>
    <h1 className='text-xl font-semibold'>Excel Imports</h1>
    <Input placeholder='Organization UUID' value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} />
    <Input placeholder='Project UUID' value={projectId} onChange={(e) => setProjectId(e.target.value)} />
    <Input type='file' accept='.xlsx,.xls' onChange={(e) => parseFile(e.target.files?.[0])} />
    {fileName ? <p className='text-sm text-slate-600'>Loaded: {fileName} {importId ? `(import: ${importId})` : ''}</p> : null}
    <div className='space-y-2'>
      {rows.map((row) => <div key={row.id} className='rounded border p-3 text-sm space-y-2'>
        <div><strong>{row.parsed_data.registration_number || 'UNKNOWN'}</strong> | date: {row.parsed_data.date ?? 'invalid'} | plant: {row.plant_match_id ?? 'unmatched'}</div>
        <div>validation: {row.validation_status}</div>
        <div>conflict: {row.conflict_status}</div>
        {row.conflict_status === 'conflict' ? <select value={row.resolution_action ?? 'keep_existing'} onChange={(e) => updateAction(row.id, e.target.value as ResolutionAction)}>
          <option value='keep_existing'>keep_existing</option>
          <option value='replace_existing'>replace_existing</option>
          <option value='skip_imported'>skip_imported</option>
          <option value='create_flagged_duplicate'>create_flagged_duplicate (not yet supported)</option>
        </select> : null}
      </div>)}
    </div>
    <Button onClick={commit} disabled={!projectId || !importId || rows.length === 0}>Commit reviewed rows</Button>
  </section>;
}
