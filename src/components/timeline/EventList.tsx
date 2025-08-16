// src/components/timeline/EventList.tsx
"use client";
import * as React from "react";
import EventCard from "./EventCard";

type CardEvent = {
  id: string;
  type: string | null;
  title: string | null;
  description: string | null;
  occurred_at: string | null;
  occurred_on: string | null;
  date_confidence?: "exact" | "approximate" | "unknown";
};

export default function EventList({ events, onEdit, onDelete }: {
  events: CardEvent[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  if (!events?.length) return <div className="text-sm text-white/60">No events yet.</div>;
  return (
    <div className="space-y-3">
      {events.map(ev => (
        <EventCard key={ev.id} event={ev} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}


