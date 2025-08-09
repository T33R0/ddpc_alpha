// Using Web Fetch API Request/Response types for route signature
import { getServerSupabase } from "@/lib/supabase";

function fmtDateUTC(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET(_req: Request): Promise<Response> {
  void _req;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Vehicles where user is owner or member
  const { data: vehicles } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname")
    .in(
      "garage_id",
      (
        await supabase
          .from("garage")
          .select("id")
          .eq("owner_id", user.id)
      ).data?.map((g: { id: string }) => g.id) ?? []
    );

  // Also include memberships
  const { data: memberGarageIds } = await supabase
    .from("garage_member")
    .select("garage_id")
    .eq("user_id", user.id);

  const memberIds = new Set((memberGarageIds ?? []).map((m: { garage_id: string }) => m.garage_id));

  // If first query missed member vehicles due to .in list empty, fetch member vehicles
  const { data: memberVehicles } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, garage_id");

  const allVehicles = new Map<string, { id: string; title: string }>();
  (vehicles ?? []).forEach((v: { id: string; year: number | null; make: string | null; model: string | null; nickname: string | null }) => {
    const title = v.nickname?.trim() ? v.nickname : [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
    allVehicles.set(v.id, { id: v.id, title });
  });
  (memberVehicles ?? []).forEach((v: { id: string; year: number | null; make: string | null; model: string | null; nickname: string | null; garage_id: string }) => {
    if (memberIds.has(v.garage_id)) {
      const title = v.nickname?.trim() ? v.nickname : [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
      allVehicles.set(v.id, { id: v.id, title });
    }
  });

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(`PRODID:-//ddpc-alpha//me-${user.id}//EN`);
  lines.push(`X-WR-CALNAME:${icsEscape("MyDDPC Reminders")}`);

  // For each vehicle, add upcoming work items (next 90d) and last service FYI
  for (const { id: vehicleId, title } of allVehicles.values()) {
    const { data: work } = await supabase
      .from("work_item")
      .select("id, title, due")
      .eq("vehicle_id", vehicleId)
      .not("due", "is", null)
      .lte("due", ninetyDays)
      .order("due", { ascending: true });

    (work ?? []).forEach((wi: { id: string; title: string | null; due: string | null }) => {
      const due = wi.due;
      if (!due) return;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:wi-${wi.id}@ddpc-alpha`);
      lines.push(`DTSTAMP:${fmtDateUTC(now)}`);
      lines.push(`DTSTART;VALUE=DATE:${due.replace(/-/g, "")}`);
      lines.push(`SUMMARY:${icsEscape(((wi.title || "Work item due") + " — " + title))}`);
      lines.push("END:VEVENT");
    });

    const { data: lastService } = await supabase
      .from("event")
      .select("id, created_at, type")
      .eq("vehicle_id", vehicleId)
      .eq("type", "SERVICE")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastService) {
      const dt = new Date((lastService as { created_at: string }).created_at);
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:svc-${(lastService as { id: string }).id}@ddpc-alpha`);
      lines.push(`DTSTAMP:${fmtDateUTC(now)}`);
      lines.push(`DTSTART:${fmtDateUTC(dt)}`);
      lines.push(`SUMMARY:${icsEscape("Last service — " + title)}`);
      lines.push("TRANSP:TRANSPARENT");
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n") + "\r\n";
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="me.ics"`,
      "cache-control": "no-store",
    },
  });
}
