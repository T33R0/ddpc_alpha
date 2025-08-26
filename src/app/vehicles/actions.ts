"use server";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity/log";

async function ensureGarageId(): Promise<string> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Try to find an existing garage; if this select errors due to RLS nuances, we'll proceed to create.
  let existingId: string | null = null;
  try {
    const { data: existing } = await supabase
      .from("garage")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    existingId = existing?.id ?? null;
  } catch {
    // ignore select errors and attempt to create
  }
  if (existingId) return existingId;

  // Create a new personal garage
  const { data: created, error: insErr } = await supabase
    .from("garage")
    .insert({ name: `${user.email?.split("@")[0]}'s Garage`, owner_id: user.id, type: "PERSONAL" })
    .select("id")
    .single();
  if (insErr) {
    // Race condition or select policy issues: re-select once
    const { data: fallback } = await supabase
      .from("garage")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    if (fallback?.id) return fallback.id as string;
    throw new Error(insErr.message);
  }

  // Add owner as member (ignore errors if already exists)
  try {
    await supabase.from("garage_member").insert({ garage_id: created.id, user_id: user.id, role: "OWNER" });
  } catch {
    // ignore
  }
  return created.id as string;
}

export async function createVehicle(formData: FormData): Promise<{ id: string } | { error: string }> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const garageId = await ensureGarageId();

  const vin = formData.get("vin")?.toString() || null;
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const make = formData.get("make")?.toString() || "";
  const model = formData.get("model")?.toString() || "";
  const trim = formData.get("trim")?.toString() || null;
  const nickname = formData.get("nickname")?.toString() || null;
  const privacy = (formData.get("privacy")?.toString() || "PRIVATE") as "PUBLIC"|"PRIVATE";

  // Note: Extended spec columns (cylinders, displacement_l, transmission) are not in the vehicle table
  // They would be added later via a separate vehicle_specs table or similar
  const { data: inserted, error } = await supabase
    .from("vehicle")
    .insert({ garage_id: garageId, vin, year, make, model, trim, nickname, privacy })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/vehicles");
  return { id: (inserted as { id: string }).id };
}

export async function updateVehiclePhoto(vehicleId: string, url: string) {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("vehicle").update({ photo_url: url }).eq("id", vehicleId);
  if (error) return { error: error.message };
  revalidatePath("/vehicles");
  return { ok: true };
}

export async function updateVehicle(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing id");
  const nickname = formData.get("nickname")?.toString() || null;
  const privacy = (formData.get("privacy")?.toString() || "PRIVATE") as "PUBLIC"|"PRIVATE";
  const vin = formData.get("vin")?.toString() || null;
  const yearVal = formData.get("year");
  const year = yearVal ? Number(yearVal) : null;
  const make = formData.get("make")?.toString() || null;
  const model = formData.get("model")?.toString() || null;
  const trim = formData.get("trim")?.toString() || null;
  const { error } = await supabase
    .from("vehicle")
    .update({ nickname, privacy, vin, year, make, model, trim })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (user) {
    await logActivity({
      actorId: user.id,
      entityType: "vehicle",
      entityId: id,
      action: "update",
      diff: { after: { nickname, privacy, vin, year, make, model, trim } },
    });
  }
  revalidatePath("/vehicles");
}

export async function deleteVehicle(id: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("vehicle").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}
