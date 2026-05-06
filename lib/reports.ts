export type ReportIpcLine = {
  id: string;
  ipc_period_id: string;
  plant_id: string;
  hours: number;
  rate: number;
  subtotal: number;
  tax_amount: number;
  total: number;
};

export type ReportTotals = {
  subtotal: number;
  taxTotal: number;
  total: number;
};

export function aggregateIpcLineTotals(lines: ReportIpcLine[]): ReportTotals {
  return lines.reduce<ReportTotals>(
    (acc, line) => ({
      subtotal: acc.subtotal + (line.subtotal ?? 0),
      taxTotal: acc.taxTotal + (line.tax_amount ?? 0),
      total: acc.total + (line.total ?? 0)
    }),
    { subtotal: 0, taxTotal: 0, total: 0 }
  );
}

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function buildIpcLinesCsv(lines: ReportIpcLine[], totals: ReportTotals): string {
  const header = ['line_id', 'ipc_period_id', 'plant_id', 'hours', 'rate', 'subtotal', 'tax_amount', 'total'];
  const dataRows = lines.map((line) => [
    line.id,
    line.ipc_period_id,
    line.plant_id,
    line.hours,
    line.rate,
    line.subtotal,
    line.tax_amount,
    line.total
  ]);

  const totalsRow = ['TOTALS', '', '', '', '', totals.subtotal, totals.taxTotal, totals.total];
  return [header, ...dataRows, totalsRow]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n');
}
