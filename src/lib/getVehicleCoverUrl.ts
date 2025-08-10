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
    const { data, error } = await supabase.storage.from("vehicle-media").list(prefix, { limit: 10, sortBy: { column: "name", order: "asc" } });
    if (error || !Array.isArray(data) || data.length === 0) return null;
    const cover = (data as Array<{ name: string }>).find((o) => /^cover\./i.test(o.name)) ?? (data as Array<{ name: string }>)[0];
    if (!cover) return null;
    const path = `${prefix}${cover.name}`;
    try {
      const { data: signed } = await supabase.storage.from("vehicle-media").createSignedUrl(path, 300);
      if (signed?.signedUrl) return signed.signedUrl as string;
    } catch {}
    const publicUrl = supabase.storage.from("vehicle-media").getPublicUrl(path)?.data?.publicUrl;
    return typeof publicUrl === "string" ? publicUrl : null;
  } catch {
    return null;
  }
}


