"use client";

import { createContext, use, useSyncExternalStore } from "react";

export type Mode = "side" | "rail" | "bar";
/** Content density by content width: 2 ≥1040, 1 ≥600, 0 below (prototype `tier`). */
export type Tier = 0 | 1 | 2;
export type Layout = { mode: Mode; mw: number; tier: Tier };

const subscribe = (onChange: () => void) => {
  addEventListener("resize", onChange);
  return () => removeEventListener("resize", onChange);
};

/**
 * The prototype lays the admin out by `innerWidth` in JS: navigation mode (sidebar ≥1024, rail ≥640,
 * top bar + tab bar below) and the content width `mw` (window minus navigation and gutters).
 * Null on the server and during hydration: the panel renders on the client only (dates are local).
 */
export function useAdminLayout(): Layout | null {
  const w = useSyncExternalStore(subscribe, () => innerWidth, () => 0);
  if (!w) return null;
  const mode: Mode = w >= 1024 ? "side" : w >= 640 ? "rail" : "bar";
  const mw = w - (mode === "side" ? 240 : mode === "rail" ? 88 : 0) - 2 * Math.min(40, Math.max(16, w * 0.03));
  const tier: Tier = mw >= 1040 ? 2 : mw >= 600 ? 1 : 0;
  return { mode, mw, tier };
}

export const LayoutContext = createContext<Layout | null>(null);

/** Layout inside the panel (provided by AdminApp once the width is known). */
export function useLayout(): Layout {
  const layout = use(LayoutContext);
  if (!layout) throw new Error("useLayout must be used inside the admin panel");
  return layout;
}
