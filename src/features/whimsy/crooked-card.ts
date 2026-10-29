"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "kz_straightened";
/** Chance that a page load hangs one collection picture crooked. */
const CHANCE = 0.4;
/** The crooked picture is one of the first cards (those are on screen when the page opens). */
const SLOTS = 8;

/** Straightened once, the perfectionist is at peace for the rest of the visit. */
const straightened = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

/** Decided on first use in the browser and kept until the picture is put right; undefined — not decided yet. */
let slot: number | null | undefined;
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const getSnapshot = () => {
  // Rolled once: null is a decision too (all hang straight), so `??=` would roll again on every render.
  if (slot === undefined) slot = !straightened() && Math.random() < CHANCE ? Math.floor(Math.random() * SLOTS) : null;
  return slot;
};

const straighten = () => {
  slot = null;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {}
  listeners.forEach((l) => l());
};

/**
 * «Поправь картину»: now and then one card of the collection grid hangs slightly crooked. Returns
 * its position in the grid (null — all hang straight) and a function that records it was put
 * right. The server renders them all straight; the browser decides after hydration.
 */
export function useCrookedSlot() {
  return [useSyncExternalStore(subscribe, getSnapshot, () => null), straighten] as const;
}

/** The picture settles on its nail: a few ever smaller swings around the vertical. */
const SWING_DEG = [-1.8, 1.1, -0.55, 0.25, -0.08, 0];

export function swingStraight(el: HTMLElement | null) {
  el?.animate(
    { rotate: SWING_DEG.map((deg) => `${deg}deg`), offset: [0, 0.28, 0.5, 0.72, 0.88, 1] },
    { duration: 1100, easing: "ease-in-out" },
  );
}
