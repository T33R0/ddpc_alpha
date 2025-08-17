"use client";

import { useEffect, useSyncExternalStore } from "react";

export type CompareItem = {
  id: string;
  title: string;
  imageSrc: string;
};

type State = {
  items: CompareItem[];
};

const KEY = "discover_compare_items";

function load(): State {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as State;
    if (!Array.isArray(parsed.items)) return { items: [] };
    return { items: parsed.items.slice(0, 3) };
  } catch {
    return { items: [] };
  }
}

let state: State = { items: [] };

const subs = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  for (const cb of subs) cb();
  persist();
}

export const compareStore = {
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => subs.delete(cb);
  },
  getSnapshot(): State {
    return state;
  },
  initFromSession() {
    state = load();
    emit();
  },
  clear() {
    state = { items: [] };
    emit();
  },
  remove(id: string) {
    state = { items: state.items.filter((i) => i.id !== id) };
    emit();
  },
  add(item: CompareItem) {
    const exists = state.items.some((i) => i.id === item.id);
    if (exists) {
      // toggle off if exists
      state = { items: state.items.filter((i) => i.id !== item.id) };
    } else {
      const next = [item, ...state.items];
      state = { items: next.slice(0, 3) };
    }
    emit();
  },
};

export function useCompare() {
  // hydrate from session on first client mount
  useEffect(() => {
    compareStore.initFromSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const snap = useSyncExternalStore(compareStore.subscribe, compareStore.getSnapshot, compareStore.getSnapshot);
  return {
    items: snap.items,
    add: compareStore.add,
    remove: compareStore.remove,
    clear: compareStore.clear,
  };
}
