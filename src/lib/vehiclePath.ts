export function getVehicleIdFromPath(pathname: string): string | null {
  if (!pathname) return null;
  // Match /vehicles/[id] or /vehicles/[id]/...
  const m = pathname.match(/^\/vehicles\/([^\/]+)(?:\/.*)?$/);
  return m?.[1] ?? null;
}
