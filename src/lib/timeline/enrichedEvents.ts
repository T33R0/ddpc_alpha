import type { SupabaseClient } from "@supabase/supabase-js";

export type EnrichedTimelineEvent = {
  id: string;
  vehicle_id: string;
  // Coarse DB type retained for filters/compat
  db_type: string;
  title: string | null;
  notes: string | null;
  display_type: string | null;   // manual key
  display_label: string | null;
  display_icon: string | null;
  display_color: string | null;
  occurred_at: string | null;
  occurred_on: string | null;
  date_confidence: "exact" | "approximate" | "unknown";
  created_at: string | null;
  updated_at: string | null;
};

export async function fetchVehicleEventsForCards(supabase: SupabaseClient, vehicleId: string, limit?: number): Promise<EnrichedTimelineEvent[]> {
  // Try enriched select first
  let q = supabase
    .from("event")
    .select("id, vehicle_id, type, title, notes, occurred_at, occurred_on, date_confidence, manual_type_key, created_at, updated_at")
    .eq("vehicle_id", vehicleId)
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (typeof limit === 'number') q = q.limit(Math.max(1, limit));
  const initial = await (q as unknown as Promise<{ data: unknown[] | null; error: unknown | null }>);
  let events = initial.data;
  const error = initial.error;

  // Fallback for environments without new columns
  let legacy = false;
  if (error || !Array.isArray(events)) {
    legacy = true;
    const res = await supabase
      .from("event")
      .select("id, vehicle_id, type, notes, created_at, updated_at")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })
      .limit(typeof limit === 'number' ? Math.max(1, limit) : 1000) as unknown as { data: unknown[] | null };
    events = Array.isArray(res.data) ? res.data : [];
  }

  // Fetch manual event types for metadata resolution
  const { data: ets } = await supabase
    .from('event_types')
    .select('key, label, icon, color')
    .eq('is_active', true);
  const meta = new Map<string, { label: string; icon: string; color: string }>();
  for (const t of (ets ?? []) as Array<{ key: string; label: string; icon: string; color: string }>) {
    meta.set(t.key, { label: t.label, icon: t.icon, color: t.color });
  }

  const out: EnrichedTimelineEvent[] = (events ?? []).map((e) => {
    const row = e as {
      id: string;
      vehicle_id: string;
      type: string;
      title?: string | null;
      notes?: string | null;
      occurred_at?: string | null;
      occurred_on?: string | null;
      date_confidence?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
      manual_type_key?: string | null;
    };
    let manualKey = row.manual_type_key ?? null;
    if (legacy && !manualKey) {
      try {
        const m = ((row.notes || '')).match(/::type=([a-z0-9_-]+)::/i);
        manualKey = m ? m[1] : null;
      } catch {}
    }
    const m = manualKey ? meta.get(manualKey) ?? null : null;
    const occurred_at = row.occurred_at ?? row.created_at ?? null;
    const occurred_on = row.occurred_on ?? (occurred_at ? occurred_at.slice(0,10) : null);
    const dc = row.date_confidence;
    const date_confidence: "exact" | "approximate" | "unknown" = (dc === 'approximate' || dc === 'unknown') ? dc : 'exact';
    return {
      id: row.id,
      vehicle_id: row.vehicle_id,
      db_type: row.type,
      title: row.title ?? null,
      notes: row.notes ?? null,
      display_type: manualKey,
      display_label: m?.label ?? null,
      display_icon: m?.icon ?? null,
      display_color: m?.color ?? null,
      occurred_at,
      occurred_on,
      date_confidence,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
    };
  });

  return out;
}


