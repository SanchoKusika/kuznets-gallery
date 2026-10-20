"use client";

import { useSyncExternalStore } from "react";

/** A line in the visitor's request (prototype `order` items). */
export type OrderItem = {
  key: number;
  code: string;
  title: string;
  src: string;
  /** Catalogue image path as stored in the DB (prototype `img`). */
  img: string;
  w: number | null;
  h: number | null;
  /** "50×70 см" or "на заказ". */
  size: string;
  price: number | null;
  frame: string;
  frameIndex: number;
};

type State = { items: OrderItem[]; drawerOpen: boolean };

const STORAGE_KEY = "kz_order";
const SERVER_STATE: State = { items: [], drawerOpen: false };

let state: State = SERVER_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) state = { ...state, items: saved };
  } catch {}
}

function set(next: Partial<State>) {
  hydrate();
  const itemsChanged = next.items && next.items !== state.items;
  state = { ...state, ...next };
  if (itemsChanged) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  hydrate();
  return state;
}

export function useOrder() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

export const order = {
  open: () => set({ drawerOpen: true }),
  close: () => set({ drawerOpen: false }),
  /** Adds a line and opens the drawer (`open: false` — just adds; the caller opens it later). */
  add: (item: Omit<OrderItem, "key">, { open = true } = {}) => {
    const items = getSnapshot().items;
    // Timestamp, bumped past existing keys so two adds in one millisecond stay distinct.
    const key = Math.max(Date.now(), ...items.map((i) => i.key + 1));
    set({ items: [...items, { ...item, key }], ...(open && { drawerOpen: true }) });
  },
  remove: (key: number) => set({ items: getSnapshot().items.filter((i) => i.key !== key) }),
  clear: () => set({ items: [] }),
};
