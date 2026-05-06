import { findEffectiveRate, PlantRate } from './rates';

export type PlantLogForIpc = { id: string; plant_id: string; date: string; billable_hours: number; ipc_period_id?: string | null };
export type IpcLine = { plant_id: string; log_id: string; log_date: string; hours: number; rate: number; subtotal: number; tax_amount: number; total: number };

export function buildIpcPreview(params: {
  logs: PlantLogForIpc[];
  rates: PlantRate[];
  selectedPlantIds: string[];
  periodStart: string;
  periodEnd: string;
  taxPercent?: number;
}) {
  const { logs, rates, selectedPlantIds, periodStart, periodEnd, taxPercent = 0 } = params;
  const start = new Date(periodStart).getTime();
  const end = new Date(periodEnd).getTime();
  const plantSet = new Set(selectedPlantIds);

  const filtered = logs.filter((l) => plantSet.has(l.plant_id) && new Date(l.date).getTime() >= start && new Date(l.date).getTime() <= end);

  const missingRates: string[] = [];
  const lines: IpcLine[] = [];

  for (const log of filtered) {
    const rate = findEffectiveRate(rates, log.plant_id, log.date);
    if (!rate) {
      missingRates.push(log.id);
      continue;
    }
    const subtotal = Number((Number(log.billable_hours) * Number(rate.rate)).toFixed(2));
    const taxAmount = Number((subtotal * (taxPercent / 100)).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));
    lines.push({ plant_id: log.plant_id, log_id: log.id, log_date: log.date, hours: Number(log.billable_hours), rate: Number(rate.rate), subtotal, tax_amount: taxAmount, total });
  }

  const subtotal = Number(lines.reduce((a, l) => a + l.subtotal, 0).toFixed(2));
  const taxTotal = Number(lines.reduce((a, l) => a + l.tax_amount, 0).toFixed(2));
  const total = Number((subtotal + taxTotal).toFixed(2));

  return { lines, missingRateLogIds: missingRates, canFinalize: missingRates.length === 0, subtotal, taxTotal, total };
}
