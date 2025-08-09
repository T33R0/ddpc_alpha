"use client";
import { useState } from "react";
import TasksBoardClient, { WorkItem as ClientWorkItem } from "./TasksBoardClient";

const STATUSES = ["BACKLOG","PLANNED","IN_PROGRESS","DONE"] as const;

export default function TasksClient({ vehicleId, initialItems }: { vehicleId: string; initialItems: ClientWorkItem[] }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string>("BACKLOG");
  const [tags, setTags] = useState("");
  const [due, setDue] = useState("");
  const [items, setItems] = useState<ClientWorkItem[]>(initialItems);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, title, status, tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : null, due: due || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create");
      const item = json.item as ClientWorkItem;
      setItems(prev => [...prev, item]);
      setTitle("");
      setTags("");
      setDue("");
      setStatus("BACKLOG");
    } catch {
      // Optionally surface a toast via useToast()
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tasks</h1>

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 border rounded p-4 bg-white shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="border rounded px-2 py-1 w-64" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1">
            {STATUSES.map(s => (<option key={s} value={s}>{s.replace("_"," ")}</option>))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Tags (comma)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="border rounded px-2 py-1 w-56" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">Due</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <button disabled={submitting} type="submit" className="bg-black text-white rounded px-3 py-1">{submitting ? "Adding..." : "Add"}</button>
      </form>

      <TasksBoardClient statuses={["BACKLOG","PLANNED","IN_PROGRESS","DONE"] as unknown as string[]} initialItems={items} />
    </div>
  );
}
