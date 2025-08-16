// src/lib/events.ts
import type * as React from "react";
import { CalendarClock, Handshake, Car, MoveRight, PackageCheck, Wrench, ClipboardList, ShieldCheck, BadgeDollarSign, FileText } from "lucide-react";

export type ManualEventType =
  | "acquired"
  | "sold"
  | "stored"
  | "registration"
  | "inspection"
  | "tuned"
  | "note";

export type EventMeta = {
  type: ManualEventType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string; // tailwind text/bg seed (e.g., 'emerald', 'rose')
};

export const EVENT_TYPES: Record<ManualEventType, EventMeta> = {
  acquired:   { type: "acquired",   label: "Acquired / Purchased",            icon: Handshake,      color: "emerald" },
  sold:       { type: "sold",       label: "Sold / Ownership Transferred",    icon: MoveRight,      color: "rose" },
  stored:     { type: "stored",     label: "Entered Storage",                 icon: PackageCheck,   color: "amber" },
  registration:{ type: "registration", label: "Registration / Title Update", icon: BadgeDollarSign, color: "sky" },
  inspection: { type: "inspection", label: "Inspection / Emissions",          icon: ShieldCheck,    color: "cyan" },
  tuned:      { type: "tuned",      label: "Tuned / Calibration",             icon: Wrench,         color: "violet" },
  note:       { type: "note",       label: "Note",                            icon: FileText,       color: "slate" },
};

// Utility: fallback-safe lookup
export function getEventMeta(kind?: string | null): EventMeta {
  const key = (kind || "note") as ManualEventType;
  return EVENT_TYPES[key] ?? EVENT_TYPES.note;
}

export function formatEventDate(dt: string | Date | null, opts?: { showTime?: boolean }) {
  if (!dt) return "";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  const showTime = opts?.showTime ?? true;
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(showTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
  return formatter.format(d);
}


