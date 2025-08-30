import type { BuyerSnapshot } from '@/types/buyer';

export async function fetchBuyerSnapshot(vehicleId: string): Promise<BuyerSnapshot | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/buyer-snapshot`, { cache: 'no-store' });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}
