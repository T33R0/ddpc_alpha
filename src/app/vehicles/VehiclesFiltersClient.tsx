"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Role = "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER" | "ALL";

export default function VehiclesFiltersClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const sort = (sp.get("sort") as "updated" | "name" | null) ?? "updated";
  const role = (sp.get("role") as Role | null) ?? "ALL";

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      if (q) next.set("q", q); else next.delete("q");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const setSort = (val: "updated" | "name") => {
    const next = new URLSearchParams(sp.toString());
    next.set("sort", val);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const setRole = (val: Role) => {
    const next = new URLSearchParams(sp.toString());
    if (val === "ALL") next.delete("role"); else next.set("role", val);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const roles: Array<{ label: string; value: Role }> = useMemo(() => ([
    { label: "All", value: "ALL" },
    { label: "Owner", value: "OWNER" },
    { label: "Manager", value: "MANAGER" },
    { label: "Contributor", value: "CONTRIBUTOR" },
    { label: "Viewer", value: "VIEWER" },
  ]), []);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Search</label>
        <input
          placeholder="Search vehicles…"
          className="border rounded px-2 py-1 w-64"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-test="vehicles-search"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Sort</label>
        <select className="border rounded px-2 py-1" value={sort} onChange={(e) => setSort(e.target.value as any)} data-test="vehicles-sort">
          <option value="updated">Last Updated</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>
      <div className="flex items-center gap-2 ml-auto text-xs" role="tablist" aria-label="Filter by role">
        {roles.map(r => (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            className={`px-2 py-1 rounded border ${role === r.value ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            role="tab"
            aria-selected={role === r.value}
            data-test={`vehicles-role-${r.value.toLowerCase()}`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}


