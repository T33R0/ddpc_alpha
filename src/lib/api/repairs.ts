import type { Repair } from '@/types/buyer';

export async function fetchRepairs(vehicleId: string): Promise<Repair[]> {
  const res = await fetch(`/api/vehicles/${vehicleId}/repairs`, { cache: 'no-store' });
  if (!res.ok) return [];
  const { items } = await res.json();
  return items ?? [];
}

export async function createRepair(vehicleId: string, data: {
  occurred_on: string;
  odo?: number;
  description: string;
  shop?: string;
  insurance_claim?: boolean;
  cost?: number;
  photos?: unknown[];
}): Promise<Repair | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/repairs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}
