"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VehicleSpecSheet from "@/components/vehicle/VehicleSpecSheet";
import VehicleQuickStats from "@/components/vehicle/VehicleQuickStats";
import VehicleTasksPeek from "@/components/vehicle/VehicleTasksPeek";
import VehicleTimelinePeek from "@/components/vehicle/VehicleTimelinePeek";
import PartsManagerCard from "@/components/vehicle/PartsManagerCard";

type VehicleIdentity = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  nickname: string | null;
};

type Task = { id: string; title: string; due: string | null; tags: string[] | null };
type Event = { id: string; created_at: string; type: string; notes: string | null };
type PeekEvent = {
  id: string;
  type: string | null;
  title: string | null;
  description: string | null;
  occurred_at: string | null;
  occurred_on: string | null;
  date_confidence?: "exact" | "approximate" | "unknown";
  icon?: string | null;
  color?: string | null;
  label?: string | null;
};

type Props = {
  vehicle: VehicleIdentity;
  quickStats: { lastActivityISO: string | null; openTaskCount: number; doneTaskCount: number; eventCount: number };
  tasks: Task[];
  events: Event[];
};

type SlideKey = "OVERVIEW" | "SPEC" | "TIMELINE" | "TASKS" | "BUILD" | "PARTS";

export default function VehicleOverviewCarousel({ vehicle, quickStats, tasks, events }: Props) {
  const [slide, setSlide] = useState<SlideKey>("OVERVIEW");

  // Expose a global setter so the top navigation can control which
  // overview slide is visible without rendering a second tab control.
  useEffect(() => {
    (window as unknown as { __vehSetSlide?: (key: SlideKey) => void; __vehGetSlide?: () => SlideKey }).__vehSetSlide = (key: SlideKey) => setSlide(key);
    (window as unknown as { __vehSetSlide?: (key: SlideKey) => void; __vehGetSlide?: () => SlideKey }).__vehGetSlide = () => slide;
    return () => {
      delete (window as unknown as { __vehSetSlide?: unknown; __vehGetSlide?: unknown }).__vehSetSlide;
      delete (window as unknown as { __vehSetSlide?: unknown; __vehGetSlide?: unknown }).__vehGetSlide;
    };
  }, [slide]);

  return (
    <div className="space-y-3">
      {/* Internal submenu removed; slide is now controlled by the pink menu */}

      <div className="relative">
        {slide === "OVERVIEW" && (
          <div className="grid md:grid-cols-3 gap-4">
            <VehicleQuickStats
              lastActivityISO={quickStats.lastActivityISO}
              openTaskCount={quickStats.openTaskCount}
              doneTaskCount={quickStats.doneTaskCount}
              eventCount={quickStats.eventCount}
            />
            <VehicleTasksPeek vehicleId={vehicle.id} tasks={tasks} />
            <VehicleTimelinePeek
              vehicleId={vehicle.id}
              events={events.map((e) => ({
                id: e.id,
                type: null,
                title: e.notes ?? null,
                description: null,
                occurred_at: e.created_at,
                occurred_on: e.created_at ? e.created_at.slice(0, 10) : null,
                date_confidence: "exact",
                icon: null,
                color: null,
                label: null,
              })) as PeekEvent[]}
            />
          </div>
        )}
        {slide === "SPEC" && <VehicleSpecSheet vehicle={vehicle} />}
        {slide === "TIMELINE" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <VehicleTimelinePeek
                vehicleId={vehicle.id}
                events={events.map((e) => ({
                  id: e.id,
                  type: null,
                  title: e.notes ?? null,
                  description: null,
                  occurred_at: e.created_at,
                  occurred_on: e.created_at ? e.created_at.slice(0, 10) : null,
                  date_confidence: "exact",
                  icon: null,
                  color: null,
                  label: null,
                })) as PeekEvent[]}
              />
            </div>
            <div className="rounded-2xl border bg-card text-fg shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="text-base font-semibold mb-2">Open full timeline</div>
                <p className="text-sm text-muted">See all events, filters, and quick add on the timeline page.</p>
              </div>
              <div className="mt-4">
                <Link href={`/timeline`} className="inline-flex items-center px-3 py-2 text-sm rounded-md border">Go to timeline</Link>
              </div>
            </div>
          </div>
        )}
        {slide === "TASKS" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <VehicleTasksPeek vehicleId={vehicle.id} tasks={tasks} />
            </div>
            <div className="rounded-2xl border bg-card text-fg shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="text-base font-semibold mb-2">Open tasks board</div>
                <p className="text-sm text-muted">Plan work, track progress, and organize by tags and due dates.</p>
              </div>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/tasks`} className="inline-flex items-center px-3 py-2 text-sm rounded-md border">Go to tasks</Link>
              </div>
            </div>
          </div>
        )}
        {slide === "BUILD" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-card text-fg shadow-sm p-5 md:col-span-2">
              <div className="text-base font-semibold mb-3">Build plans</div>
              <p className="text-sm text-muted">Group tasks into phases, road‑map upgrades, and merge plans when ideas come together.</p>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/plans`} className="inline-flex items-center px-3 py-2 text-sm rounded-md border">Open build plans</Link>
              </div>
            </div>
            <div className="rounded-2xl border bg-card text-fg shadow-sm p-5">
              <div className="text-sm font-semibold mb-2">Tips</div>
              <ul className="text-sm list-disc pl-5 space-y-1 text-muted">
                <li>Create a “baseline service” plan for maintenance.</li>
                <li>Keep performance, cosmetic, and reliability as separate plans.</li>
              </ul>
            </div>
          </div>
        )}
        {slide === "PARTS" && (
          <div className="grid md:grid-cols-3 gap-4">
            <PartsManagerCard />
            <div className="rounded-2xl border bg-card text-fg shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="text-base font-semibold mb-2">Why track parts?</div>
                <p className="text-sm text-muted">Keep a history of what’s installed, when, and for how much. It helps with troubleshooting and resale.</p>
              </div>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/plans`} className="inline-flex items-center px-3 py-2 text-sm rounded-md border">Organize with build plans</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


