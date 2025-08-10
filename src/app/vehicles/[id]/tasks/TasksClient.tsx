"use client";
import { useState } from "react";
import TasksBoardClient, { WorkItem as ClientWorkItem } from "./TasksBoardClient";
import { useToast } from "@/components/ui/ToastProvider";
import TemplateQuickAdd from "@/components/tasks/TemplateQuickAdd";
import { GLOBAL_TEMPLATES, TaskTemplate } from "@/components/tasks/templates";

const STATUSES = ["BACKLOG","PLANNED","IN_PROGRESS","DONE"] as const;

type Plan = { id: string; name: string; is_default: boolean };
export default function TasksClient({ vehicleId, initialItems, canWrite = true, plans = [], defaultPlanId = null }: { vehicleId: string; initialItems: ClientWorkItem[]; canWrite?: boolean; plans?: Plan[]; defaultPlanId?: string | null }) {
  const { success, error } = useToast();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string>("BACKLOG");
  const [tags, setTags] = useState("");
  const [due, setDue] = useState("");
  const [items, setItems] = useState<ClientWorkItem[]>(initialItems);
  const [planId, setPlanId] = useState<string | "">(defaultPlanId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [lastTemplateId, setLastTemplateId] = useState<string | null>(null);

  const applyTemplate = (t: TaskTemplate) => {
    setTitle(t.title);
    setTags((t.default_tags ?? []).join(", "));
    if (t.suggested_due_interval_days && t.suggested_due_interval_days > 0) {
      const now = new Date();
      const ms = t.suggested_due_interval_days * 24 * 60 * 60 * 1000;
      const dueDate = new Date(now.getTime() + ms).toISOString().slice(0, 10);
      setDue(dueDate);
    }
    setLastTemplateId(t.id);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
     if (!canWrite) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, title, status, tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : null, due: due || null, build_plan_id: planId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create");
      const item = json.item as ClientWorkItem;
      setItems(prev => [...prev, item]);
      setTitle("");
      setTags("");
      setDue("");
      setStatus("BACKLOG");
      success("Task created");
      // Best-effort activity log (server may ignore).
      console.info(JSON.stringify({ level: "info", q: "work_item_created_from_template", vehicleId, itemId: item.id, templateId: lastTemplateId }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create";
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tasks</h1>

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 border rounded p-4 bg-white shadow-sm">
        {canWrite && (
          <TemplateQuickAdd
            templates={GLOBAL_TEMPLATES}
            canWrite={canWrite}
            onChoose={applyTemplate}
          />
        )}
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="border rounded px-2 py-1 w-64 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Plan</label>
          <select data-testid="task-plan-select" value={planId} onChange={(e) => setPlanId(e.target.value)} className="border rounded px-2 py-1 disabled:opacity-50 min-w-[10rem]" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined}>
            <option value="">No plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.is_default ? " (default)" : ""}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined}>
            {STATUSES.map(s => (<option key={s} value={s}>{s.replace("_"," ")}</option>))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Tags (comma)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="border rounded px-2 py-1 w-56 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Due</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="border rounded px-2 py-1 disabled:opacity-50" disabled={!canWrite} title={!canWrite ? "Insufficient permissions" : undefined} />
        </div>
        <button disabled={!canWrite || submitting} type="submit" className="bg-black text-white rounded px-3 py-1 disabled:opacity-50" title={!canWrite ? "Insufficient permissions" : undefined}>{submitting ? "Adding..." : "Add"}</button>
      </form>

      <TasksBoardClient statuses={["BACKLOG","PLANNED","IN_PROGRESS","DONE"] as unknown as string[]} initialItems={items} canWrite={canWrite} />
    </div>
  );
}
