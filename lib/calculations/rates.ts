export type PlantRate = {
  plant_id: string;
  rate: number;
  unit: 'hour' | 'day' | 'month' | 'fixed';
  effective_from: string;
  effective_to?: string | null;
};

export function findEffectiveRate(rates: PlantRate[], plantId: string, serviceDate: string): PlantRate | null {
  const t = new Date(serviceDate).getTime();
  const matches = rates
    .filter((r) => r.plant_id === plantId)
    .filter((r) => {
      const from = new Date(r.effective_from).getTime();
      const to = r.effective_to ? new Date(r.effective_to).getTime() : Number.POSITIVE_INFINITY;
      return t >= from && t <= to;
    })
    .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime());

  return matches[0] ?? null;
}
