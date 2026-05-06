const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const isNotOnSite = (startTime?: string | null, endTime?: string | null) => !startTime && !endTime;

export function calculateGrossHours(startTime?: string | null, endTime?: string | null, lunchHours = 0): number {
  if (!startTime || !endTime) return 0;
  const raw = (toMinutes(endTime) - toMinutes(startTime)) / 60 - lunchHours;
  return Math.max(0, Number(raw.toFixed(2)));
}

export function calculateBillableHours(grossHours: number, unproductiveHours = 0, breakdownHours = 0): number {
  const value = grossHours - unproductiveHours - breakdownHours;
  return Math.max(0, Number(value.toFixed(2)));
}
