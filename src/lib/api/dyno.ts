import type { DynoRun } from '@/types/buyer';

export async function fetchDynoRuns(vehicleId: string): Promise<DynoRun[]> {
  const res = await fetch(`/api/vehicles/${vehicleId}/dyno-runs`, { cache: 'no-store' });
  if (!res.ok) return [];
  const { items } = await res.json();
  return items ?? [];
}

export async function createDynoRun(vehicleId: string, data: {
  run_on: string;
  odo?: number;
  tune_label?: string;
  whp?: number;
  wtq?: number;
  boost_psi?: number;
  afr_note?: string;
  sheet_media_id?: string;
}): Promise<DynoRun | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/dyno-runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}
