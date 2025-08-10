"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

type Props = {
  options?: Option[]; // optional; can be provided by server
  placeholder?: string;
  // When provided, the filter will behave as a scoped navigator instead of URL query filter
  mode?: "query" | "scoped";
  // Current vehicle id when in scoped mode
  currentId?: string;
  // Subroute to keep on navigation in scoped mode: e.g. "timeline" | "tasks"
  targetSubroute?: string;
};

export default function VehicleFilter({ options = [], placeholder = "All vehicles", mode = "query", currentId = "", targetSubroute }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = mode === "scoped" ? (currentId ?? "") : (searchParams.get("vehicleId") ?? "");

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (mode === "scoped") {
      if (!value) return; // require a selection
      const sub = targetSubroute ? `/${targetSubroute}` : "";
      router.push(`/vehicles/${value}${sub}`);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("vehicleId", value);
      } else {
        params.delete("vehicleId");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }
    const announcer = document.querySelector<HTMLElement>('[data-testid="filter-announcer"]');
    if (announcer) {
      const selected = options.find((o) => o.id === value)?.name ?? (value ? value : "All vehicles");
      announcer.textContent = mode === "scoped"
        ? `Vehicle changed to ${selected}.`
        : `Filter updated: Vehicle ${selected}`;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="vehicle-filter" className="text-sm text-gray-700">Vehicle</label>
      <select
        id="vehicle-filter"
        data-testid="filter-vehicle"
        className="border rounded px-2 py-1 text-sm"
        value={current}
        onChange={onChange}
      >
        {mode === "query" && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}
