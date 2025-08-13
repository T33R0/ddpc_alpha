"use client";

import { useState } from "react";
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

type Props = {
  vehicle: VehicleIdentity;
  quickStats: { lastActivityISO: string | null; openTaskCount: number; doneTaskCount: number; eventCount: number };
  tasks: Task[];
  events: Event[];
};

type SlideKey = "OVERVIEW" | "SPEC" | "TIMELINE" | "TASKS" | "BUILD" | "PARTS";

export default function VehicleOverviewCarousel({ vehicle, quickStats, tasks, events }: Props) {
  const [slide, setSlide] = useState<SlideKey>("OVERVIEW");

  const slides: Array<{ key: SlideKey; label: string }> = [
    { key: "OVERVIEW", label: "Overview" },
    { key: "TIMELINE", label: "Timeline" },
    { key: "TASKS", label: "Tasks" },
    { key: "BUILD", label: "Build" },
    { key: "PARTS", label: "Parts" },
    { key: "SPEC", label: "Specs" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-lg border bg-white overflow-hidden">
          {slides.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`px-3 py-1.5 text-sm ${slide === s.key ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setSlide(s.key)}
              aria-pressed={slide === s.key}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

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
            <VehicleTimelinePeek vehicleId={vehicle.id} events={events} />
          </div>
        )}
        {slide === "SPEC" && <VehicleSpecSheet vehicle={vehicle} />}
        {slide === "TIMELINE" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <VehicleTimelinePeek vehicleId={vehicle.id} events={events} />
            </div>
            <div className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="text-base font-semibold mb-2">Open full timeline</div>
                <p className="text-sm text-gray-600">See all events, filters, and quick add on the timeline page.</p>
              </div>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/timeline`} className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black">Go to timeline</Link>
              </div>
            </div>
          </div>
        )}
        {slide === "TASKS" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <VehicleTasksPeek vehicleId={vehicle.id} tasks={tasks} />
            </div>
            <div className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="text-base font-semibold mb-2">Open tasks board</div>
                <p className="text-sm text-gray-600">Plan work, track progress, and organize by tags and due dates.</p>
              </div>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/tasks`} className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black">Go to tasks</Link>
              </div>
            </div>
          </div>
        )}
        {slide === "BUILD" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-white shadow-sm p-5 md:col-span-2">
              <div className="text-base font-semibold mb-3">Build plans</div>
              <p className="text-sm text-gray-700">Group tasks into phases, road‑map upgrades, and merge plans when ideas come together.</p>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/plans`} className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black">Open build plans</Link>
              </div>
            </div>
            <div className="rounded-2xl border bg-white shadow-sm p-5">
              <div className="text-sm font-semibold mb-2">Tips</div>
              <ul className="text-sm list-disc pl-5 space-y-1 text-gray-700">
                <li>Create a “baseline service” plan for maintenance.</li>
                <li>Keep performance, cosmetic, and reliability as separate plans.</li>
              </ul>
            </div>
          </div>
        )}
        {slide === "PARTS" && (
          <div className="grid md:grid-cols-3 gap-4">
            <PartsManagerCard vehicleId={vehicle.id} />
            <div className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="text-base font-semibold mb-2">Why track parts?</div>
                <p className="text-sm text-gray-600">Keep a history of what’s installed, when, and for how much. It helps with troubleshooting and resale.</p>
              </div>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/plans`} className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black">Organize with build plans</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


