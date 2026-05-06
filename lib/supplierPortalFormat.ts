export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsedDateOnly = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (Number.isNaN(parsedDateOnly.getTime())) return value;

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC'
    }).format(parsedDateOnly);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(parsed);
}

export function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)} hrs`;
}
