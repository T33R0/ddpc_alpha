export async function getVehicleCoverUrl(supabase: any, vehicleId: string, dbPhotoUrl?: string | null): Promise<string | null> {
  // Prefer DB column if present
  if (dbPhotoUrl && typeof dbPhotoUrl === "string" && dbPhotoUrl.trim().length > 0) {
    return dbPhotoUrl;
  }
  // Try public storage bucket (best effort). Use public URL if bucket is public.
  try {
    const prefix = `${vehicleId}/`;
    const { data, error } = await supabase.storage.from("vehicle-media").list(prefix, { limit: 10, sortBy: { column: "name", order: "asc" } });
    if (error || !Array.isArray(data) || data.length === 0) return null;
    const cover = data.find((o: any) => /^cover\./i.test(o.name)) || data[0];
    if (!cover) return null;
    const path = `${prefix}${cover.name}`;
    const publicUrl = supabase.storage.from("vehicle-media").getPublicUrl(path)?.data?.publicUrl;
    return typeof publicUrl === "string" ? publicUrl : null;
  } catch {
    return null;
  }
}


