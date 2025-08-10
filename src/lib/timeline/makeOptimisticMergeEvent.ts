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

export type OptimisticEvent = {
  id: string;
  type: "SERVICE"; // reuse existing type for display
  notes: string;
  created_at: string;
};

export function makeOptimisticMergeEvent(detail: MergeDetail): OptimisticEvent {
  const from = detail.from_plan_id || detail.fromId || "from";
  const to = detail.to_plan_id || detail.toId || "to";
  const title = (detail.title || "Merge plans").trim();
  const notes = detail.notes?.trim();
  const text = `${title}: ${from} → ${to}${notes ? ` — ${notes}` : ""}`;
  return {
    id: `merge-${Date.now()}`,
    type: "SERVICE",
    notes: text,
    created_at: new Date().toISOString(),
  };
}


