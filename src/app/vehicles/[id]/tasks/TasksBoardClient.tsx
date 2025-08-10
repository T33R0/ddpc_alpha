"use client";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { useCallback, useEffect, useMemo, useState } from "react";
import CompleteModal from "@/components/tasks/CompleteModal";
import PlanPill from "@/components/tasks/PlanPill";
import PlanSwitcher from "@/components/tasks/PlanSwitcher";
import { useToast } from "@/components/ui/ToastProvider";

export type WorkItem = { id: string; title: string; status: string; tags: string[] | null; due: string | null; build_plan_id?: string | null };

type Plan = { id: string; name: string; is_default: boolean };

export default function TasksBoardClient({
  statuses,
  initialItems,
  canWrite = true,
  plans = [],
  vehicleId,
}: {
  statuses: string[];
  initialItems: WorkItem[];
  canWrite?: boolean;
  plans?: Plan[];
  vehicleId?: string;
}) {
  const [items, setItems] = useState<WorkItem[]>(initialItems);
  const { success, error } = useToast();
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingTitleOrig, setEditingTitleOrig] = useState<string>("");
  const [editingDueId, setEditingDueId] = useState<string | null>(null);
  const [editingDue, setEditingDue] = useState<string>("");
  const [editingDueOrig, setEditingDueOrig] = useState<string>("");
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string>("");
  const [editingTagsOrig, setEditingTagsOrig] = useState<string>("");

  // Pending states for micro-loading/disabled cues
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingStatusIds, setPendingStatusIds] = useState<Set<string>>(new Set());
  const [pendingTitleId, setPendingTitleId] = useState<string | null>(null);
  const [pendingDuePendingId, setPendingDuePendingId] = useState<string | null>(null);
  const [pendingTagsPendingId, setPendingTagsPendingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  // Feature flag: client gate. Allow a non-production test override via localStorage for Playwright.
  const enableLink =
    (process.env.NEXT_PUBLIC_ENABLE_TASK_EVENT_LINK || "false") === "true" ||
    (process.env.NODE_ENV !== "production" && typeof window !== "undefined" &&
      (() => {
        try {
          return window.localStorage.getItem("e2e_enable_task_event_link") === "1";
        } catch {
          return false;
        }
      })());
  // Sync when parent provides new items (e.g., after create)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const itemsByStatus = useMemo(() => {
    const map: Record<string, WorkItem[]> = Object.fromEntries(statuses.map(s => [s, []]));
    for (const it of items) {
      (map[it.status] ?? (map[it.status] = [])).push(it);
    }
    return map;
  }, [items, statuses]);

  const applyStatus = useCallback(async (id: string, to: string) => {
    const from = items.find(i => i.id === id)?.status;
    if (!from || from === to) return;
    if (pendingStatusIds.has(id)) return; // block duplicate
    // optimistic move
    setItems(prev => prev.map(i => (i.id === id ? { ...i, status: to } : i)));
    setPendingStatusIds(prev => new Set(prev).add(id));
    try {
      await fetch(`/api/work-items/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      }).then(r => {
        if (!r.ok) throw new Error("Failed to update status");
      });
      success(`Moved to ${to.replace("_"," ")}`);
    } catch (e) {
      // revert
      setItems(prev => prev.map(i => (i.id === id ? { ...i, status: from } : i)));
      const msg = e instanceof Error ? e.message : "Failed to update status";
      error(msg);
    } finally {
      setPendingStatusIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }, [items, pendingStatusIds, success, error]);

  const applyDelete = useCallback(async (id: string) => {
    if (pendingDeleteId === id) return; // block duplicate
    const prev = items;
    setItems(prev.filter(i => i.id !== id));
    setPendingDeleteId(id);
    try {
      await fetch(`/api/work-items/${id}`, { method: "DELETE" }).then(r => {
        if (!r.ok) throw new Error("Failed to delete");
      });
      success("Task deleted");
    } catch (e) {
      // revert
      setItems(prev);
      const msg = e instanceof Error ? e.message : "Failed to delete";
      error(msg);
    } finally {
      setPendingDeleteId(current => (current === id ? null : current));
    }
  }, [items, pendingDeleteId, success, error]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.droppableId;
    const to = result.destination.droppableId;
    const id = result.draggableId;
    if (from === to && result.destination.index === result.source.index) return;
    if (canWrite) applyStatus(id, to);
  }, [applyStatus, canWrite]);

  const startEdit = useCallback((id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
    setEditingTitleOrig(title);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingTitle("");
    setEditingTitleOrig("");
  }, []);

  const saveEdit = useCallback(async () => {
    const id = editingId;
    const title = editingTitle.trim();
    if (!id || !title) {
      cancelEdit();
      return;
    }
    if (pendingTitleId === id) return; // block duplicate
    const prev = items;
    setItems(prev.map(i => (i.id === id ? { ...i, title } : i)));
    setPendingTitleId(id);
    try {
      await fetch(`/api/work-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).then(r => { if (!r.ok) throw new Error("Failed to rename"); });
      success("Task renamed");
      cancelEdit();
    } catch (e) {
      setItems(prev);
      const msg = e instanceof Error ? e.message : "Failed to rename";
      error(msg);
    } finally {
      setPendingTitleId(current => (current === id ? null : current));
    }
  }, [editingId, editingTitle, items, pendingTitleId, cancelEdit, success, error]);

  const startDueEdit = useCallback((id: string, dueISO: string | null) => {
    setEditingDueId(id);
    // Normalize to yyyy-mm-dd if present
    let val = "";
    if (dueISO) {
      const d = new Date(dueISO);
      if (!isNaN(d.getTime())) {
        val = d.toISOString().slice(0, 10);
      }
    }
    setEditingDue(val);
    setEditingDueOrig(val);
  }, []);

  const cancelDueEdit = useCallback(() => {
    setEditingDueId(null);
    setEditingDue("");
    setEditingDueOrig("");
  }, []);

  const saveDueEdit = useCallback(async () => {
    const id = editingDueId;
    if (!id) return cancelDueEdit();
    const due = editingDue.trim(); // "" to clear
    if (pendingDuePendingId === id) return; // block duplicate
    const prev = items;
    setItems(prev.map(i => (i.id === id ? { ...i, due: due ? new Date(due).toISOString() : null } : i)));
    setPendingDuePendingId(id);
    try {
      await fetch(`/api/work-items/${id}/due`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due: due || null }),
      }).then(r => { if (!r.ok) throw new Error("Failed to update due date"); });
      success(due ? "Due date updated" : "Due date cleared");
      cancelDueEdit();
    } catch (e) {
      setItems(prev);
      const msg = e instanceof Error ? e.message : "Failed to update due date";
      error(msg);
    } finally {
      setPendingDuePendingId(current => (current === id ? null : current));
    }
  }, [editingDueId, editingDue, items, pendingDuePendingId, cancelDueEdit, success, error]);

  const startTagsEdit = useCallback((id: string, tags: string[] | null) => {
    setEditingTagsId(id);
    setEditingTags((tags ?? []).join(", "));
    setEditingTagsOrig((tags ?? []).join(", "));
  }, []);

  const cancelTagsEdit = useCallback(() => {
    setEditingTagsId(null);
    setEditingTags("");
    setEditingTagsOrig("");
  }, []);

  const saveTagsEdit = useCallback(async () => {
    const id = editingTagsId;
    if (!id) return cancelTagsEdit();
    const text = editingTags.trim();
    const tagsArr = text ? text.split(",").map(t => t.trim()).filter(Boolean) : null;
    if (pendingTagsPendingId === id) return; // block duplicate
    const prev = items;
    setItems(prev.map(i => (i.id === id ? { ...i, tags: tagsArr } : i)));
    setPendingTagsPendingId(id);
    try {
      await fetch(`/api/work-items/${id}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagsArr }),
      }).then(r => { if (!r.ok) throw new Error("Failed to update tags"); });
      success("Tags updated");
      cancelTagsEdit();
    } catch (e) {
      setItems(prev);
      const msg = e instanceof Error ? e.message : "Failed to update tags";
      error(msg);
    } finally {
      setPendingTagsPendingId(current => (current === id ? null : current));
    }
  }, [editingTagsId, editingTags, items, pendingTagsPendingId, cancelTagsEdit, success, error]);

  // Plan switcher state
  const [switchPlanForId, setSwitchPlanForId] = useState<string | null>(null);

  // Derived card busy state
  const isCardBusy = useCallback((id: string) => {
    return (
      pendingDeleteId === id ||
      pendingStatusIds.has(id) ||
      pendingTitleId === id ||
      pendingDuePendingId === id ||
      pendingTagsPendingId === id
    );
  }, [pendingDeleteId, pendingStatusIds, pendingTitleId, pendingDuePendingId, pendingTagsPendingId]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-white text-gray-600 w-full">
          <div className="text-lg font-medium text-gray-800 mb-1">No tasks yet</div>
          <div className="text-sm">Use the form above to add your first task, then drag across columns.</div>
        </div>
      ) : (
      <div className="grid md:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <Droppable droppableId={status} key={status} direction="vertical">
            {(dropProvided) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="rounded-md border bg-white p-4 shadow-sm overflow-visible">
                <div className="mb-3 text-sm font-semibold tracking-wide text-gray-700">{status.replace("_", " ")}</div>
                <div className="space-y-2">
                  {(itemsByStatus[status] ?? []).map((it, idx) => (
                    <Draggable index={idx} draggableId={it.id} key={it.id} isDragDisabled={isCardBusy(it.id) || !canWrite}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`relative rounded-md border bg-white p-3 shadow hover:shadow-md transition ${snapshot.isDragging ? "z-20 ring-2 ring-blue-200" : "z-10"} ${isCardBusy(it.id) ? "opacity-60" : ""}`}
                        >
                          {isCardBusy(it.id) && (
                            <div className="absolute inset-0 bg-white/40 pointer-events-none flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" aria-label="Updating"></div>
                            </div>
                          )}
                          <div className="text-sm font-semibold text-gray-900">
                            {editingId === it.id ? (
                              <input
                                autoFocus
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit();
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                disabled={isCardBusy(it.id)}
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            ) : (
                               <button className="text-left w-full hover:underline disabled:opacity-50" disabled={isCardBusy(it.id) || !canWrite} title={!canWrite ? "Insufficient permissions" : undefined} onClick={() => startEdit(it.id, it.title)}>
                                {it.title}
                              </button>
                            )}
                          </div>
                          {editingId === it.id && (
                            <div className="mt-1 flex items-center gap-2">
                               <button
                                className="text-xs px-2 py-0.5 border rounded bg-gray-50 disabled:opacity-50"
                                 onClick={saveEdit}
                                 disabled={!canWrite || isCardBusy(it.id) || editingTitle.trim() === editingTitleOrig.trim()}
                                 title={!canWrite ? "Insufficient permissions" : undefined}
                              >
                                {pendingTitleId === it.id ? "Saving…" : "Save"}
                              </button>
                              <button
                                className="text-xs px-2 py-0.5 border rounded"
                                onClick={cancelEdit}
                                disabled={isCardBusy(it.id)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-gray-600">
                            {editingTagsId === it.id ? (
                              <input
                                value={editingTags}
                                onChange={(e) => setEditingTags(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveTagsEdit();
                                  if (e.key === "Escape") cancelTagsEdit();
                                }}
                                placeholder="tags, comma, separated"
                                disabled={isCardBusy(it.id)}
                                className="w-full border rounded px-2 py-0.5 text-xs"
                              />
                            ) : (
                              <button className="hover:underline disabled:opacity-50" disabled={isCardBusy(it.id)} onClick={() => startTagsEdit(it.id, it.tags)}>
                                {(it.tags ?? []).length ? (it.tags ?? []).join(", ") : "Add tags"}
                              </button>
                            )}
                          </div>
                          {editingTagsId === it.id && (
                            <div className="mt-1 flex items-center gap-2">
                               <button
                                className="text-xs px-2 py-0.5 border rounded bg-gray-50 disabled:opacity-50"
                                 onClick={saveTagsEdit}
                                 disabled={!canWrite || isCardBusy(it.id) || editingTags.trim() === editingTagsOrig.trim()}
                                 title={!canWrite ? "Insufficient permissions" : undefined}
                              >
                                {pendingTagsPendingId === it.id ? "Saving…" : "Save"}
                              </button>
                              <button
                                className="text-xs px-2 py-0.5 border rounded"
                                onClick={cancelTagsEdit}
                                disabled={isCardBusy(it.id)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-gray-600">
                            {editingDueId === it.id ? (
                              <input
                                type="date"
                                value={editingDue}
                                onChange={(e) => setEditingDue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveDueEdit();
                                  if (e.key === "Escape") cancelDueEdit();
                                }}
                                disabled={isCardBusy(it.id)}
                                className="border rounded px-2 py-0.5 text-xs"
                              />
                            ) : (
                              <button
                                className="hover:underline disabled:opacity-50"
                                disabled={isCardBusy(it.id)}
                                onClick={() => startDueEdit(it.id, it.due)}
                              >
                                {it.due ? `Due: ${new Date(it.due).toLocaleDateString()}` : "Set due date"}
                              </button>
                            )}
                          </div>
                          {editingDueId === it.id && (
                            <div className="mt-1 flex items-center gap-2">
                               <button
                                className="text-xs px-2 py-0.5 border rounded bg-gray-50 disabled:opacity-50"
                                 onClick={saveDueEdit}
                                 disabled={!canWrite || isCardBusy(it.id) || editingDue.trim() === editingDueOrig.trim()}
                                 title={!canWrite ? "Insufficient permissions" : undefined}
                              >
                                {pendingDuePendingId === it.id ? "Saving…" : "Save"}
                              </button>
                              <button
                                className="text-xs px-2 py-0.5 border rounded"
                                onClick={cancelDueEdit}
                                disabled={isCardBusy(it.id)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 relative">
                            <PlanPill
                              name={(() => {
                                const pid = it.build_plan_id ?? null;
                                if (!pid) return "No plan";
                                const plan = plans.find(p => p.id === pid);
                                return plan?.name ?? "No plan";
                              })()}
                              onClick={() => setSwitchPlanForId(prev => (prev === it.id ? null : it.id))}
                            />
                            {switchPlanForId === it.id && (
                              <PlanSwitcher
                                plans={plans}
                                currentPlanId={it.build_plan_id ?? null}
                                onClose={() => setSwitchPlanForId(null)}
                                onSelect={async (planId) => {
                                  setSwitchPlanForId(null);
                                  const prev = items;
                                  setItems(prev.map(x => (x.id === it.id ? { ...x, build_plan_id: planId } : x)));
                                  try {
                                    // Feature flag gate; endpoint may not exist
                                    const enabled = (process.env.NEXT_PUBLIC_ENABLE_PLAN_SWITCH || "false") === "true";
                                    if (!enabled) throw new Error("Not yet wired");
                                    const res = await fetch(`/api/work-items/${it.id}/plan`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ build_plan_id: planId }),
                                    });
                                    if (!res.ok) throw new Error("Failed to update plan");
                                    success("Plan updated");
                                  } catch (e) {
                                    setItems(prev);
                                    const msg = e instanceof Error ? e.message : "Failed to update plan";
                                    error(msg === "Not yet wired" ? msg : "Failed to update plan");
                                  }
                                }}
                              />
                            )}
                            {statuses.filter(s => s !== status).map(s => (
                              <button
                                key={s}
                                className="text-xs px-2 py-0.5 border rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => {
                                  if (enableLink && s === "DONE") {
                                    setCompletingId(it.id);
                                  } else {
                                    applyStatus(it.id, s);
                                  }
                                }}
                                disabled={!canWrite || isCardBusy(it.id)}
                                title={!canWrite ? "Insufficient permissions" : undefined}
                              >
                                → {s.replace("_", " ")}
                              </button>
                            ))}
                            <button
                              onClick={() => applyDelete(it.id)}
                              className="text-xs text-red-600 hover:underline ml-auto disabled:opacity-50"
                              disabled={!canWrite || isCardBusy(it.id)}
                              title={!canWrite ? "Insufficient permissions" : undefined}
                            >
                              {pendingDeleteId === it.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {dropProvided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
      )}
      {enableLink && (
        <CompleteModal
          open={!!completingId}
          defaultTitle={(items.find(i => i.id === completingId)?.title) || ""}
          onCancel={() => setCompletingId(null)}
          onSubmit={async ({ logEvent, title, notes, dateISO }) => {
            const id = completingId;
            setCompletingId(null);
            if (!id) return;
            const prev = items;
            setItems(prev.map(i => (i.id === id ? { ...i, status: "DONE" } : i)));
            try {
              const res = await fetch(`/api/work-items/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "DONE", logEvent, eventPayload: { title, notes, date: dateISO } }),
              });
              if (!res.ok) {
                throw new Error((await res.json()).error || "Failed to complete");
              }
              success(`Task completed${logEvent ? ", event logged" : ""}`);
            } catch (e) {
              setItems(prev);
              error(e instanceof Error ? e.message : "Failed to complete");
            }
          }}
        />
      )}
    </DragDropContext>
  );
}
