"use client";

import { useState } from "react";
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

export default function VehicleOverviewCarousel({ vehicle, quickStats, tasks, events }: Props) {
  const [slide, setSlide] = useState<"OVERVIEW" | "SPEC">("OVERVIEW");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{slide === "OVERVIEW" ? "Overview" : "Official performance"}</div>
        <div className="inline-flex rounded-lg border bg-white overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm ${slide === "OVERVIEW" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setSlide("OVERVIEW")}
            aria-pressed={slide === "OVERVIEW"}
          >
            Overview
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm ${slide === "SPEC" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setSlide("SPEC")}
            aria-pressed={slide === "SPEC"}
          >
            Official performance
          </button>
        </div>
      </div>

      <div className="relative">
        {slide === "OVERVIEW" ? (
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
        ) : (
          <VehicleSpecSheet vehicle={vehicle} />
        )}
      </div>
    </div>
  );
}


