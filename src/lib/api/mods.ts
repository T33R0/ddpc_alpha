import type { ModEntry } from '@/types/buyer';

export async function fetchMods(vehicleId: string): Promise<ModEntry[]> {
  const res = await fetch(`/api/vehicles/${vehicleId}/mods`, { cache: 'no-store' });
  if (!res.ok) return [];
  const { items } = await res.json();
  return items ?? [];
}
