"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  options?: string[];
};

export default function TagFilter({ options = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("tag") ?? "";

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("tag", value); else params.delete("tag");
    router.replace(`${pathname}?${params.toString()}`);
    const announcer = document.querySelector<HTMLElement>('[data-testid="filter-announcer"]');
    if (announcer) announcer.textContent = `Filter updated: Tag ${value || 'Any'}`;
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tag-filter" className="text-sm text-gray-700">Tag</label>
      <select id="tag-filter" data-testid="filter-tag" className="border rounded px-2 py-1 text-sm" value={current} onChange={onChange}>
        <option value="">Any</option>
        {options.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
