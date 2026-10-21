"use client";

import { createContext, use, useCallback, useState, type ReactNode } from "react";
import type { FormatKey } from "@/content/site";

export type Sort = 0 | 1 | 2;

/** Works per page; the grid's 2 / 3 / 4 / 6 columns all divide it (Collection.module.scss). */
export const PAGE_SIZE = 24;

export type CollectionFilters = {
  format: FormatKey | "all";
  /** 0 — catalogue order, 1 — price ascending, 2 — price descending. */
  sort: Sort;
  query: string;
  view: "grid" | "list";
  /** How many works are shown ("Показать ещё" adds PAGE_SIZE). */
  limit: number;
};

type Value = [CollectionFilters, (patch: Partial<CollectionFilters>) => void];

const DEFAULTS: CollectionFilters = { format: "all", sort: 0, query: "", view: "grid", limit: PAGE_SIZE };
const FiltersContext = createContext<Value | null>(null);

/**
 * Collection view state, held in the collection layout so it outlives category switches
 * (and Next's hidden <Activity> copies of visited categories share one `limit`).
 * As in the prototype, picking a category, a format or a search starts the list over.
 */
export function CollectionFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState(DEFAULTS);
  const update = useCallback((patch: Partial<CollectionFilters>) => setFilters((f) => ({ ...f, ...patch })), []);
  return <FiltersContext value={[filters, update]}>{children}</FiltersContext>;
}

export function useCollectionFilters() {
  const value = use(FiltersContext);
  if (!value) throw new Error("useCollectionFilters outside CollectionFiltersProvider");
  return value;
}
