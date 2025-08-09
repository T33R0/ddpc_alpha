"use server";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase";

export async function createEvent(vehicleId: string, formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();
  const type = (formData.get("type")?.toString() || "SERVICE") as "SERVICE"|"INSTALL"|"INSPECT"|"TUNE";
  const odometer = formData.get("odometer") ? Number(formData.get("odometer")) : null;
  const cost = formData.get("cost") ? Number(formData.get("cost")) : null;
  const notes = formData.get("notes")?.toString() || null;

  const { error } = await supabase.from("event").insert({ vehicle_id: vehicleId, type, odometer, cost, notes });
  if (error) throw new Error(error.message);
  revalidatePath(`/vehicles/${vehicleId}/timeline`);
}

export async function deleteEvent(eventId: string, vehicleId: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("event").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/vehicles/${vehicleId}/timeline`);
}
