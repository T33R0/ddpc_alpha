import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";

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

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  void _req;
  const supabase = await getServerSupabase();
  const { id: vehicleId } = await ctx.params;
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Identify actor if present to determine member/owner mode
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch vehicle basics to craft calendar name and know privacy
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, privacy")
    .eq("id", vehicleId)
    .maybeSingle();

  const title = vehicle?.nickname?.trim()
    ? vehicle.nickname
    : [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ") || "Vehicle";

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(`PRODID:-//ddpc-alpha//vehicle-${vehicleId}//EN`);
  lines.push(`X-WR-CALNAME:${icsEscape(title)} reminders`);

  // Last SERVICE event (FYI) – accessible to public via RLS event_public_select
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
    lines.push(`SUMMARY:${icsEscape("Last service (FYI)")}`);
    lines.push("TRANSP:TRANSPARENT");
    lines.push("END:VEVENT");
  }

  // Upcoming work items within 90 days – only include when authenticated (owner/member)
  if (user) {
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
      // All-day event for due date; use DTSTART; no DTEND to keep simple
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:wi-${wi.id}@ddpc-alpha`);
      lines.push(`DTSTAMP:${fmtDateUTC(now)}`);
      lines.push(`DTSTART;VALUE=DATE:${due.replace(/-/g, "")}`);
      lines.push(`SUMMARY:${icsEscape(wi.title || "Work item due")}`);
      lines.push("END:VEVENT");
    });
  }

  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n") + "\r\n";
  // Dev-only log; ids only
  serverLog("ics_vehicle_served", { vehicleId, userId: user?.id });
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="vehicle-${vehicleId}.ics"`,
      "cache-control": "no-store",
    },
  });
}
