export type MergePayload = {
  from_plan_id: string;
  to_plan_id: string;
  vehicle_id: string;
  title?: string;
  notes?: string;
};

export function validateMergePayload(body: unknown): { ok: true; data: MergePayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid JSON' };
  const b = body as Record<string, unknown>;
  const from_plan_id = String(b.from_plan_id || '').trim();
  const to_plan_id = String(b.to_plan_id || '').trim();
  const vehicle_id = String(b.vehicle_id || '').trim();
  if (!from_plan_id || !to_plan_id || !vehicle_id) return { ok: false, error: 'from_plan_id, to_plan_id, vehicle_id are required' };
  if (from_plan_id === to_plan_id) return { ok: false, error: 'from_plan_id and to_plan_id must differ' };
  const payload: MergePayload = {
    from_plan_id,
    to_plan_id,
    vehicle_id,
  };
  if (b.title != null) payload.title = String(b.title);
  if (b.notes != null) payload.notes = String(b.notes);
  return { ok: true, data: payload };
}
