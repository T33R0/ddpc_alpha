export async function fetchFactoryConfig(vehicleId: string): Promise<{ decoded?: Record<string, unknown>; options?: Record<string, unknown> } | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/factory-config`, { cache: 'no-store' });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}

export async function updateFactoryConfig(vehicleId: string, data: {
  decoded?: Record<string, unknown>;
  options?: Record<string, unknown>;
}): Promise<{ decoded?: Record<string, unknown>; options?: Record<string, unknown> } | null> {
  const res = await fetch(`/api/vehicles/${vehicleId}/factory-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const { item } = await res.json();
  return item ?? null;
}
