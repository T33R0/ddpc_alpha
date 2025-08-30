import type { Inspection } from '@/types/buyer';

export async function fetchInspections(vehicleId: string): Promise<Inspection[]> {
  const res = await fetch(`/api/vehicles/${vehicleId}/inspections`, { cache: 'no-store' });
  if (!res.ok) return [];
  const { items } = await res.json();
  return items ?? [];
}

export async function createInspection(vehicleId: string, data: {
  kind: 'ppi' | 'emissions' | 'general';
  inspected_on: string;
  odo?: number;
  result?: string;
  report_media_id?: string;
}): Promise<Inspection | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/inspections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}
