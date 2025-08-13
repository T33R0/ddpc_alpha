"use client";

import { useState } from "react";
import Link from "next/link";
import VehicleSpecSheet from "@/components/vehicle/VehicleSpecSheet";
import VehicleQuickStats from "@/components/vehicle/VehicleQuickStats";
import VehicleTasksPeek from "@/components/vehicle/VehicleTasksPeek";
import VehicleTimelinePeek from "@/components/vehicle/VehicleTimelinePeek";

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
    { key: "SPEC", label: "Official performance" },
    { key: "TIMELINE", label: "Timeline" },
    { key: "TASKS", label: "Tasks" },
    { key: "BUILD", label: "Build" },
    { key: "PARTS", label: "Parts" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{slides.find((s) => s.key === slide)?.label}</div>
        <div className="flex flex-wrap gap-1">
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
            <div className="rounded-2xl border bg-white shadow-sm p-5 md:col-span-2">
              <div className="text-base font-semibold mb-3">Parts on hand</div>
              <ul className="divide-y">
                {[{ n: "Carbon intake kit", v: "AeroWorks", p: "$1,249", s: "In box" }, { n: "Coilover set", v: "KW V3", p: "$2,090", s: "Installed" }, { n: "Performance pads", v: "Ferodo DS2500", p: "$289", s: "Awaiting rotors" }].map((row) => (
                  <li key={row.n} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{row.n}</div>
                      <div className="text-gray-600">{row.v}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{row.p}</div>
                      <div className="text-gray-600">{row.s}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="text-base font-semibold mb-2">Manage parts</div>
                <p className="text-sm text-gray-600">Track cost, vendor links, and install status from a dedicated page.</p>
              </div>
              <div className="mt-4">
                <Link href={`/vehicles/${vehicle.id}/plans`} className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black">Start with build plans</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


