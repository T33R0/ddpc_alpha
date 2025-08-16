// src/components/timeline/EventTypeIcon.tsx
"use client";
import * as React from "react";
import { getEventMeta } from "@/lib/events";
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function EventTypeIcon({ type, size = 20 }: { type?: string | null; size?: number }) {
  const meta = getEventMeta(type);
  const Icon = meta.icon;
  const bgClass: Record<string, string> = {
    emerald: "bg-emerald-500/15",
    rose: "bg-rose-500/15",
    amber: "bg-amber-500/15",
    sky: "bg-sky-500/15",
    cyan: "bg-cyan-500/15",
    violet: "bg-violet-500/15",
    slate: "bg-slate-500/15",
  };
  const textClass: Record<string, string> = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    sky: "text-sky-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    slate: "text-slate-400",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl",
        bgClass[meta.color] || bgClass.slate,
        textClass[meta.color] || textClass.slate,
        "h-9 w-9"
      )}
      aria-label={meta.label}
      title={meta.label}
    >
      <Icon size={size} className="shrink-0" />
    </div>
  );
}


