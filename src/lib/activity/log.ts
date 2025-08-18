import { getServerSupabase } from "@/lib/supabase";

export type ActivityEntityType = "vehicle" | "event" | "work_item" | "garage" | "build_plan" | "job" | "job_part";
export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "invite_created"
  | "invite_revoked"
  | "member_joined_from_invite";

export async function logActivity(input: {
  actorId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  diff?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await getServerSupabase();
    await supabase.from("activity_log").insert({
      user_id: input.actorId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      diff: input.diff ?? null,
    });
  } catch {
    // Ignore activity log errors by design
  }
}


