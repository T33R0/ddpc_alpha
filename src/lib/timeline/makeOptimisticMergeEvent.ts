import type { TimelineEvent } from "@/app/vehicles/[id]/timeline/TimelineClient";
export type MergeDetail = {
  vehicle_id?: string;
  from_plan_id?: string;
  to_plan_id?: string;
  title?: string;
  notes?: string;
  // Alt keys from our modal emitter
  vehicleId?: string;
  fromId?: string;
  toId?: string;
};

export function makeOptimisticMergeEvent(detail: MergeDetail): TimelineEvent {
  const from = detail.from_plan_id || detail.fromId || "from";
  const to = detail.to_plan_id || detail.toId || "to";
  const title = (detail.title || "Merge plans").trim();
  const notes = detail.notes?.trim();
  const text = `${title}: ${from} → ${to}${notes ? ` — ${notes}` : ""}`;
  return {
    id: `merge-${Date.now()}`,
    vehicle_id: detail.vehicle_id || detail.vehicleId || "",
    type: "MERGE",
    title,
    notes: text,
    created_at: detail.occurred_at ?? new Date().toISOString(),
    optimistic: true,
  };
}


