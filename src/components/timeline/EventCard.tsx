// src/components/timeline/EventCard.tsx
"use client";
import * as React from "react";
import EventTypeIcon from "./EventTypeIcon";
import { getEventMeta, formatEventDate } from "@/lib/events";
import clsx from "clsx";

type EventCardProps = {
  event: {
    id: string;
    type: string | null;            // "acquired" | "sold" | ...
    title: string | null;           // short title (optional)
    description: string | null;     // notes (optional)
    occurred_at: string | null;     // timestamp when time is known
    occurred_on: string | null;     // date-only when time unknown
    date_confidence?: "exact" | "approximate" | "unknown";
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const meta = getEventMeta(event.type);
  const showTime = event.date_confidence === "exact" && !!event.occurred_at;
  const displayDate = formatEventDate(event.occurred_at ?? event.occurred_on, { showTime });

  return (
    <article
      className={clsx(
        "group relative w-full rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/[0.08] transition-colors"
      )}
    >
      <div className="flex items-start gap-3">
        <EventTypeIcon type={event.type} />

        <div className="min-w-0 flex-1">
          {/* Top row: type label + date */}
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-sm font-medium text-white/90">{meta.label}</div>
            <time className="shrink-0 text-xs text-white/60">{displayDate}</time>
          </div>

          {/* Title (optional) */}
          {event.title ? (
            <div className="mt-0.5 text-[15px] font-semibold text-white line-clamp-1">
              {event.title}
            </div>
          ) : null}

          {/* Description preview */}
          {event.description ? (
            <p className="mt-1 text-sm text-white/80 line-clamp-2">
              {event.description}
            </p>
          ) : null}
        </div>

        {/* Actions (show on hover) */}
        <div className="flex grow-0 shrink-0 items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={() => onEdit(event.id)} className="text-xs text-white/70 hover:text-white underline">
              Edit
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(event.id)} className="text-xs text-rose-400 hover:text-rose-300 underline">
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}


