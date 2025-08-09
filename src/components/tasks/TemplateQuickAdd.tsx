"use client";
import { useMemo, useState } from "react";
import type { TaskTemplate } from "./templates";

export default function TemplateQuickAdd({
  templates,
  canWrite = true,
  onChoose,
}: {
  templates: TaskTemplate[];
  canWrite?: boolean;
  onChoose: (t: TaskTemplate) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.default_tags ?? []).some(tag => tag.toLowerCase().includes(q))
    );
  }, [query, templates]);

  return (
    <div className="flex items-end gap-2" data-test="template-quick-add">
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Template</label>
        <input
          placeholder="Search templates…"
          className="border rounded px-2 py-1 w-64 disabled:opacity-50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!canWrite}
          title={!canWrite ? "Insufficient permissions" : undefined}
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Pick</label>
        <select
          className="border rounded px-2 py-1 w-72 disabled:opacity-50"
          disabled={!canWrite || filtered.length === 0}
          title={!canWrite ? "Insufficient permissions" : undefined}
          onChange={(e) => {
            const id = e.target.value;
            const t = filtered.find(tt => tt.id === id);
            if (t) onChoose(t);
            // reset selection back to placeholder
            e.currentTarget.selectedIndex = 0;
          }}
        >
          <option value="">Select a template…</option>
          {filtered.map(t => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
