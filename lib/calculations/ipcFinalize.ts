import { IpcLine } from './ipc';

export type FinalizeIpcPayload = {
  project_id: string;
  supplier_id: string;
  period_start: string;
  period_end: string;
  selected_plant_ids: string[];
  tax_percent: number;
  lines: IpcLine[];
};

export function buildFinalizeIpcPayload(input: FinalizeIpcPayload) {
  const { project_id, supplier_id, period_start, period_end, selected_plant_ids, tax_percent, lines } = input;

  if (!project_id || !supplier_id) throw new Error('Project and supplier are required.');
  if (!period_start || !period_end) throw new Error('Period start/end are required.');
  if (new Date(period_end).getTime() < new Date(period_start).getTime()) throw new Error('Period end must be on or after period start.');
  if (!selected_plant_ids.length) throw new Error('At least one plant must be selected.');
  if (!lines.length) throw new Error('No IPC line items to finalize.');

  const plantSet = new Set(selected_plant_ids);
  for (const line of lines) {
    if (!plantSet.has(line.plant_id)) throw new Error('Line items must belong to selected plants only.');
  }

  return {
    p_project_id: project_id,
    p_supplier_id: supplier_id,
    p_period_start: period_start,
    p_period_end: period_end,
    p_selected_plant_ids: selected_plant_ids,
    p_tax_percent: tax_percent,
    p_lines: lines
  };
}
