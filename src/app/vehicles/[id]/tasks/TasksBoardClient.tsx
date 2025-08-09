"use client";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { useCallback, useEffect, useMemo, useState } from "react";

export type WorkItem = { id: string; title: string; status: string; tags: string[] | null; due: string | null };

export default function TasksBoardClient({
  statuses,
  initialItems,
}: {
  statuses: string[];
  initialItems: WorkItem[];
}) {
  const [items, setItems] = useState<WorkItem[]>(initialItems);
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
    setItems(prev => prev.map(i => (i.id === id ? { ...i, status: to } : i)));
    try {
      await fetch(`/api/work-items/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      }).then(r => {
        if (!r.ok) throw new Error("Failed to update status");
      });
    } catch {
      // revert
      setItems(prev => prev.map(i => (i.id === id ? { ...i, status: from } : i)));
    }
  }, [items]);

  const applyDelete = useCallback(async (id: string) => {
    const prev = items;
    setItems(prev.filter(i => i.id !== id));
    try {
      await fetch(`/api/work-items/${id}`, { method: "DELETE" }).then(r => {
        if (!r.ok) throw new Error("Failed to delete");
      });
    } catch {
      // revert
      setItems(prev);
    }
  }, [items]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.droppableId;
    const to = result.destination.droppableId;
    const id = result.draggableId;
    if (from === to && result.destination.index === result.source.index) return;
    applyStatus(id, to);
  }, [applyStatus]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid md:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <Droppable droppableId={status} key={status} direction="vertical">
            {(dropProvided) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="rounded-md border bg-white p-4 shadow-sm overflow-visible">
                <div className="mb-3 text-sm font-semibold tracking-wide text-gray-700">{status.replace("_", " ")}</div>
                <div className="space-y-2">
                  {(itemsByStatus[status] ?? []).map((it, idx) => (
                    <Draggable index={idx} draggableId={it.id} key={it.id}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`relative rounded-md border bg-white p-3 shadow hover:shadow-md transition ${snapshot.isDragging ? "z-20 ring-2 ring-blue-200" : "z-10"}`}
                        >
                          <div className="text-sm font-semibold text-gray-900">{it.title}</div>
                          <div className="text-xs text-gray-600">{(it.tags ?? []).join(", ")}</div>
                          {it.due && (
                            <div className="text-xs text-gray-600">Due: {new Date(it.due).toLocaleDateString()}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {statuses.filter(s => s !== status).map(s => (
                              <button
                                key={s}
                                className="text-xs px-2 py-0.5 border rounded hover:bg-gray-100"
                                onClick={() => applyStatus(it.id, s)}
                              >
                                → {s.replace("_", " ")}
                              </button>
                            ))}
                            <button
                              onClick={() => applyDelete(it.id)}
                              className="text-xs text-red-600 hover:underline ml-auto"
                            >
                              Delete
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
    </DragDropContext>
  );
}
