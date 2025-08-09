"use server";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase";

export async function createWorkItem(vehicleId: string, formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();
  const title = formData.get("title")?.toString() || "";
  const status = (formData.get("status")?.toString() || "BACKLOG") as "BACKLOG"|"PLANNED"|"IN_PROGRESS"|"DONE";
  const tagsStr = formData.get("tags")?.toString() || ""; // comma separated
  const dueStr = formData.get("due")?.toString() || "";
  const due = dueStr ? new Date(dueStr).toISOString().slice(0,10) : null;
  const tags = tagsStr ? tagsStr.split(",").map(t=>t.trim()).filter(Boolean) : [];

  const { error } = await supabase.from("work_item").insert({ vehicle_id: vehicleId, title, status, tags, due });
  if (error) throw new Error(error.message);
  revalidatePath(`/vehicles/${vehicleId}/tasks`);
}

export async function updateWorkItemStatus(itemId: string, status: "BACKLOG"|"PLANNED"|"IN_PROGRESS"|"DONE", vehicleId: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("work_item").update({ status }).eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/vehicles/${vehicleId}/tasks`);
}

export async function deleteWorkItem(itemId: string, vehicleId: string): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("work_item").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/vehicles/${vehicleId}/tasks`);
}
