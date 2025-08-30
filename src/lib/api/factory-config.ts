/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchFactoryConfig(vehicleId: string): Promise<{ decoded?: Record<string, any>; options?: Record<string, any> } | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/factory-config`, { cache: 'no-store' });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}

export async function updateFactoryConfig(vehicleId: string, data: {
  decoded?: Record<string, any>;
  options?: Record<string, any>;
}): Promise<{ decoded?: Record<string, any>; options?: Record<string, any> } | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/factory-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
