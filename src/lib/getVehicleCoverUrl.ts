import type { SupabaseClient } from "@supabase/supabase-js";

export async function getVehicleCoverUrl(
  supabase: SupabaseClient,
  vehicleId: string,
  dbPhotoUrl?: string | null
): Promise<string | null> {
  // Prefer DB column if present
  if (dbPhotoUrl && typeof dbPhotoUrl === "string" && dbPhotoUrl.trim().length > 0) {
    return dbPhotoUrl;
  }
  // Try storage: prefer a short-lived signed URL; fall back to public URL if bucket allows it.
  try {
    const prefix = `${vehicleId}/`;
    // Prefer cover.*; else most recently updated image
    const { data } = await supabase.storage.from("vehicle-media").list(prefix, { limit: 100 });
    if (!Array.isArray(data) || data.length === 0) return null;
    const files = data as Array<{ name: string }>;
    const cover = files.find(f => /^cover\./i.test(f.name)) ?? files[0];
    const path = `${prefix}${cover.name}`;
    const { data: signed } = await supabase.storage.from("vehicle-media").createSignedUrl(path, 300);
    return signed?.signedUrl ?? null;
  } catch {
    return null;
  }
}


