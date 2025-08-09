"use client";
import { useEffect, useMemo, useState } from "react";
import type { TaskTemplate } from "./templates";

export default function TemplateQuickAdd({ templates, canWrite = true, onChoose }: { templates: TaskTemplate[]; canWrite?: boolean; onChoose: (t: TaskTemplate) => void; }) {
  const [query, setQuery] = useState("");
  const [dbTemplates, setDbTemplates] = useState<TaskTemplate[] | null>(null);
  useEffect(() => {
    const clientFlag = (process.env.NEXT_PUBLIC_ENABLE_DB_TEMPLATES || "false") === "true";
    if (!clientFlag) return;
    fetch("/api/templates").then(r => r.json()).then(j => {
      if (Array.isArray(j.templates)) setDbTemplates(j.templates);
    }).catch(() => setDbTemplates(null));
  }, []);
  const merged = useMemo(() => {
    const all = [...(dbTemplates ?? []), ...templates];
    const seen = new Set<string>();
    return all.filter(t => {
      const key = t.title.toLowerCase();
      if (seen.has(key)) return false; seen.add(key); return true;
    });
  }, [dbTemplates, templates]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = merged;
    if (!q) return list;
    return list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.default_tags ?? []).some(tag => tag.toLowerCase().includes(q))
    );
  }, [query, merged]);

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
              {t.title}{t.scope === 'GARAGE' ? ' • garage' : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
