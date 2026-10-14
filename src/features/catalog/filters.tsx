"use client";

import { createContext, use, useCallback, useState, type ReactNode } from "react";
import type { FormatKey } from "@/content/site";

export type Sort = 0 | 1 | 2;

export type CollectionFilters = {
  format: FormatKey | "all";
  /** 0 — catalogue order, 1 — price ascending, 2 — price descending. */
  sort: Sort;
  query: string;
  view: "grid" | "list";
};

type Value = [CollectionFilters, (patch: Partial<CollectionFilters>) => void];

const DEFAULTS: CollectionFilters = { format: "all", sort: 0, query: "", view: "grid" };
const FiltersContext = createContext<Value | null>(null);

/**
 * Format, sort, search and view outlive category switches (they live in the collection layout),
 * as in the prototype where switching chips kept them.
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
