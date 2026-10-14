"use client";

import { useSyncExternalStore } from "react";
import type { CategoryKey } from "@/content/site";

type Key = CategoryKey | "all";

/**
 * The collection category the visitor browsed last (prototype: `state.cat`, kept in `kz_route`).
 * "← Коллекция" on an artwork returns there; "all" until a collection page is opened.
 */
const STORAGE_KEY = "kz_collection";
const listeners = new Set<() => void>();

function read(): Key {
  try {
    return (sessionStorage.getItem(STORAGE_KEY) as Key | null) ?? "all";
  } catch {
    return "all";
  }
}

export function rememberCategory(key: Key) {
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLastCategory(): Key {
  return useSyncExternalStore(subscribe, read, () => "all");
}
