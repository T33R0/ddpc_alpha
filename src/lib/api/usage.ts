import type { UsageLog } from '@/types/buyer';

export async function fetchUsageLogs(vehicleId: string): Promise<UsageLog[]> {
  const res = await fetch(`/api/vehicles/${vehicleId}/usage`, { cache: 'no-store' });
  if (!res.ok) return [];
  const { items } = await res.json();
  return items ?? [];
}

export async function createUsageLog(vehicleId: string, data: {
  occurred_on: string;
  odo?: number;
  kind: 'daily' | 'weekend' | 'track_day' | 'road_trip' | 'show' | 'storage';
  details?: string;
}): Promise<UsageLog | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}
