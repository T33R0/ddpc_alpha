// src/components/timeline/EventTypeIcon.tsx
"use client";
import * as React from "react";
import { getEventMeta } from "@/lib/events";
import clsx from "clsx";

export default function EventTypeIcon({ type, size = 20 }: { type?: string | null; size?: number }) {
  const meta = getEventMeta(type);
  const Icon = meta.icon;
  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-xl",
        `bg-${meta.color}-500/15`,
        `text-${meta.color}-400`,
        "h-9 w-9"
      )}
      aria-label={meta.label}
      title={meta.label}
    >
      <Icon size={size} className="shrink-0" />
    </div>
  );
}


