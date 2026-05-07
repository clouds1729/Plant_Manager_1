'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildImportReviewRows, type ImportReviewRow, type ResolutionAction } from '@/lib/imports/workflow';
import { isImportCommitSummary } from '@/lib/imports/commit';
import { getCurrentMembership } from '@/lib/membership';

type StagedRow = ImportReviewRow & { id: string };
type ProjectOption = { id: string; name: string | null };

export default function ImportsPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [importId, setImportId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<StagedRow[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const loadProjects = async (orgId: string) => {
    setIsProjectsLoading(true);
    setProjectsError('');
    const { data, error } = await supabase
      .from('projects')
      .select('id,name')
      .eq('organization_id', orgId)
      .order('name');

    if (error) {
      setProjects([]);
      setProjectsError(`Failed to load projects: ${error.message}`);
    } else {
      setProjects((data ?? []) as ProjectOption[]);
    }
    setIsProjectsLoading(false);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const membership = await getCurrentMembership();
      const nextOrgId = membership?.organization_id ?? '';
      setOrganizationId(nextOrgId);

      if (!nextOrgId) {
        setProjects([]);
        setProjectsError('No active organization membership found.');
        setIsProjectsLoading(false);
        return;
      }

      await loadProjects(nextOrgId);
    };

    void bootstrap();
  }, []);

  const ensureOrganizationId = async () => {
    if (organizationId) return organizationId;
    const membership = await getCurrentMembership();
    const next = membership?.organization_id ?? '';
    setOrganizationId(next);
    return next;
  };

  const parseFile = async (file?: File) => {
    if (!file) return;
    setErrorMessage('');
    setSuccessMessage('');
    if (!projectId) {
      setErrorMessage('Project UUID is required before parsing.');
      return;
    }
    setIsParsing(true);
    setFileName(file.name);
    try {
      const orgId = await ensureOrganizationId();
      if (!orgId) throw new Error('No active organization membership found.');

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: null });
      if (jsonRows.length === 0) throw new Error('No rows found in the selected file.');

      const { data: plants, error: plantsError } = await supabase.from('plants').select('id,registration_number');
      if (plantsError) throw new Error(plantsError.message);
      const { data: logs, error: logsError } = await supabase.from('plant_logs').select('id,plant_id,date');
      if (logsError) throw new Error(logsError.message);
      const reviewRows = buildImportReviewRows(jsonRows, plants ?? [], logs ?? []);

      const { data: createdImport, error: importError } = await supabase
        .from('imports')
        .insert({ organization_id: orgId, project_id: projectId, source_type: 'excel', file_name: file.name, status: 'parsed' })
        .select('id')
        .single();
      if (importError || !createdImport) throw new Error(importError?.message ?? 'Failed to create import staging record.');

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

      if (rowsError) throw new Error(rowsError.message);

      setImportId(createdImport.id);
      setRows((stagedRows ?? []).map((row) => ({ ...row, validation_warnings: [] })) as StagedRow[]);
      setSuccessMessage(`Staged ${stagedRows?.length ?? 0} rows from ${file.name}.`);
      if (stagedRows && stagedRows.length === 0) setErrorMessage('No valid rows found to stage.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse and stage import file.';
      setErrorMessage(message);
    } finally {
      setIsParsing(false);
    }
  };

  const updateAction = async (rowId: string, resolution: ResolutionAction) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, resolution_action: resolution } : r)));
    await supabase.from('import_rows').update({ resolution_action: resolution }).eq('id', rowId);
  };

  const commit = async () => {
    if (!importId) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsCommitting(true);
    const { data, error } = await supabase.rpc('commit_import_rows', { p_import_id: importId });
    if (error) {
      setErrorMessage(`Commit failed: ${error.message}`);
      setIsCommitting(false);
      return;
    }

    const summary = Array.isArray(data) ? data[0] : data;
    if (!isImportCommitSummary(summary)) {
      setErrorMessage('Import committed, but summary payload was malformed.');
      setIsCommitting(false);
      return;
    }
    setSuccessMessage(`Import commit complete. Inserted: ${summary.inserted_count}, updated: ${summary.updated_count}, skipped: ${summary.skipped_count}.`);
    setIsCommitting(false);
  };

  const hasCommittableRows = rows.some((row) => row.validation_status !== 'invalid' && !!row.plant_match_id);

  return <section className='space-y-4'>
    <h1 className='text-xl font-semibold'>Excel Imports</h1>
    <Input placeholder='Organization UUID (auto from membership)' value={organizationId} readOnly />
    <label className='text-sm'>Project<select className='mt-1 w-full rounded border p-2' value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={isProjectsLoading || projects.length === 0}><option value=''>Select project</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name ?? p.id}</option>)}</select></label>
    {isProjectsLoading ? <p className='text-sm text-slate-600'>Loading projects...</p> : null}
    {!isProjectsLoading && !projectsError && projects.length === 0 ? <p className='text-sm text-slate-600'>No projects found. Create a project first.</p> : null}
    {projectsError ? <p role='alert' className='text-sm text-red-600'>{projectsError}</p> : null}
    <Input type='file' accept='.xlsx,.xls,.csv' onChange={(e) => parseFile(e.target.files?.[0])} />
    {fileName ? <p className='text-sm text-slate-600'>Loaded: {fileName} {importId ? `(import: ${importId})` : ''}</p> : null}
    {errorMessage ? <p className='text-sm text-red-600'>{errorMessage}</p> : null}
    {successMessage ? <p className='text-sm text-emerald-700'>{successMessage}</p> : null}
    {isParsing ? <p className='text-sm text-slate-600'>Parsing and staging rows...</p> : null}
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
    <Button onClick={commit} disabled={!projectId || !importId || rows.length === 0 || !hasCommittableRows || isParsing || isCommitting}>{isCommitting ? 'Committing...' : 'Commit reviewed rows'}</Button>
  </section>;
}
