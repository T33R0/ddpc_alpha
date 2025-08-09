type Meta = Record<string, unknown> | undefined | null;

function filterIds(meta: Meta): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta || typeof meta !== "object") return out;
  for (const [k, v] of Object.entries(meta)) {
    if (/id/i.test(k)) out[k] = v as unknown;
  }
  return out;
}

export function serverLog(event: string, meta?: Meta): void {
  if (process.env.NODE_ENV === "production") return;
  try {
    const payload = { level: "info", event, ...filterIds(meta) };
    // Single-line JSON; ids-only to avoid PII
    console.info(JSON.stringify(payload));
  } catch {
    // no-op
  }
}
