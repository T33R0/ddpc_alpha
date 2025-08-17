"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function PaginationClient({ totalCount, page, limit }: { totalCount: number; page: number; limit: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, limit)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const limits = [10, 20, 50, 100];

  const replace = (next: URLSearchParams) => {
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  };

  const onSetPage = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(Math.max(1, Math.min(totalPages, p))));
    replace(next);
  };

  const onSetLimit = (l: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("limit", String(l));
    next.set("page", "1");
    replace(next);
  };

  if (totalCount === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span>Per page:</span>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={limit}
          onChange={(e) => onSetLimit(Number(e.target.value))}
        >
          {limits.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <span className="text-gray-500">{totalCount} results</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          onClick={() => onSetPage(page - 1)}
          disabled={!canPrev}
        >
          Prev
        </button>
        <span className="text-sm">Page {page} of {totalPages}</span>
        <button
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          onClick={() => onSetPage(page + 1)}
          disabled={!canNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
