export type UpdateWorkItemPlanPayload = {
  plan_id: string;
};

export function validateUpdateWorkItemPlanPayload(body: unknown): { ok: true; data: UpdateWorkItemPlanPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid JSON' };
  const b = body as Record<string, unknown>;
  const plan_id = String(b.plan_id || '').trim();
  if (!plan_id) return { ok: false, error: 'plan_id is required' };
  return { ok: true, data: { plan_id } };
}
