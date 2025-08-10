"use client";
import { useEffect, useMemo, useState } from "react";
import VehicleCard from "@/components/vehicle/VehicleCard";
import VehicleCardSkeleton from "@/components/vehicles/VehicleCardSkeleton";

type VehicleRow = {
  id: string;
  nickname: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  privacy: string | null;
  photo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  garage_id: string;
};

type Metrics = { upcoming: number; lastService: string | null; daysSince: number | null; avgBetween: number | null };

export default function VehiclesListClient({
  vehicles,
  loadCoverUrl,
  metrics,
  isSignedIn,
}: {
  vehicles: VehicleRow[];
  loadCoverUrl: (id: string, photoUrl: string | null) => Promise<string | null>;
  metrics: Record<string, Metrics>;
  isSignedIn: boolean;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const [q, setQ] = useState<string>("");
  const [sort, setSort] = useState<"updated" | "name" | "year">("updated");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const entries = await Promise.all(
        vehicles.map(async (v) => [v.id, await loadCoverUrl(v.id, v.photo_url)] as const)
      );
      if (!cancelled) {
        const map: Record<string, string | null> = {};
        for (const [id, url] of entries) map[id] = url;
        setCovers(map);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [vehicles, loadCoverUrl]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = ql
      ? vehicles.filter((v) => {
          const name = (v.nickname ?? "").toLowerCase();
          const y = v.year ? String(v.year) : "";
          const mm = `${v.make ?? ""} ${v.model ?? ""}`.toLowerCase();
          return (
            name.includes(ql) || y.includes(ql) || mm.includes(ql)
          );
        })
      : vehicles.slice();
    list.sort((a, b) => {
      if (sort === "name") {
        const an = (a.nickname ?? "").toLowerCase();
        const bn = (b.nickname ?? "").toLowerCase();
        if (an < bn) return -1; if (an > bn) return 1; return a.id.localeCompare(b.id);
      }
      if (sort === "year") {
        const ay = a.year ?? -Infinity;
        const by = b.year ?? -Infinity;
        if (ay !== by) return by - ay; // desc year by default
        return a.id.localeCompare(b.id);
      }
      // updated
      const aKey = a.updated_at ?? a.created_at ?? "";
      const bKey = b.updated_at ?? b.created_at ?? "";
      if (aKey && bKey) {
        const ad = new Date(aKey).getTime();
        const bd = new Date(bKey).getTime();
        if (ad !== bd) return bd - ad; // desc
        return a.id.localeCompare(b.id);
      }
      if (aKey) return -1;
      if (bKey) return 1;
      return a.id.localeCompare(b.id);
    });
    return list;
  }, [vehicles, q, sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vehicles"
            className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            data-testid="vehicles-search"
          />
        </div>
        <div>
          <label className="text-xs text-muted">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            data-testid="vehicles-sort"
          >
            <option value="updated">Last Updated</option>
            <option value="name">Name</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-card text-muted" data-testid="vehicles-empty">
          <div className="text-lg font-medium text-fg mb-1">No vehicles match your search</div>
          <div className="text-sm mb-3">Try adjusting your search or add a new vehicle.</div>
          <a href="#add-vehicle" className="bg-brand text-white rounded px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">Add vehicle</a>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const m = metrics[v.id] ?? { upcoming: 0, lastService: null, daysSince: null, avgBetween: null };
            const coverUrl = covers[v.id] ?? null;
            return (
              <article key={v.id} aria-labelledby={`veh-${v.id}-title`}>
                <VehicleCard
                  v={{ id: v.id, nickname: v.nickname, year: v.year, make: v.make, model: v.model, trim: v.trim, privacy: v.privacy ?? "PRIVATE", coverUrl }}
                  m={m}
                  isSignedIn={isSignedIn}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


