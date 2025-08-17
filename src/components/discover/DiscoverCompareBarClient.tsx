"use client";

import Image from "next/image";
import { useCompare } from "./compareStore";

export default function DiscoverCompareBarClient() {
  const { items, remove, clear } = useCompare();
  if (!items.length) return null;
  return (
    <div className="mb-4 rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Compare ({items.length}/3)</h3>
        <button className="text-xs text-red-600 hover:underline" onClick={() => clear()}>Clear all</button>
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {items.map((v) => (
          <div key={v.id} className="flex min-w-[220px] items-center gap-3 rounded border px-2 py-2">
            <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
              <Image src={v.imageSrc} alt={v.title} fill className="object-cover" sizes="80px" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{v.title}</div>
              <button
                className="mt-1 text-xs text-gray-600 hover:underline"
                onClick={() => remove(v.id)}
              >Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
