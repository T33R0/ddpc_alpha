import type { TimelineEventType } from "@/lib/types/events";
export type QuickAddEventType = Extract<TimelineEventType, "SERVICE" | "MOD" | "DYNO" | "NOTE">;

export function eventTypeForQuickAdd(title: string): TimelineEventType {
  const t = title.toLowerCase();
  if (/\b(oil|fluid|service|maint(en(ance)?)?)\b/.test(t)) return "SERVICE";
  if (/\b(dyno|baseline|power|hp|tq)\b/.test(t)) return "DYNO";
  if (/\b(install|swap|upgrade|mod|bolt-on)\b/.test(t)) return "MOD";
  return "NOTE";
}


