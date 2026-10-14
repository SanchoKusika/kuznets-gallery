"use client";

import { getLenis } from "./smooth-scroll";

/**
 * Page scroll lock (prototype: `html { overflow: hidden }` while the mobile menu is open).
 * Implemented as `html[data-scroll-lock]` so no inline styles are written. Smooth scroll stops
 * while anything holds a lock; `keepScrollbar` (the request drawer, which leaves the page
 * visible under its scrim) only stops it, without hiding the scrollbar.
 */
const owners = new Map<string, boolean>();

export function lockScroll(owner: string, { keepScrollbar = false } = {}) {
  owners.set(owner, keepScrollbar);
  sync();
}

export function unlockScroll(owner: string) {
  owners.delete(owner);
  sync();
}

export const isScrollLocked = () => owners.size > 0;

function sync() {
  const hide = [...owners.values()].some((keep) => !keep);
  document.documentElement.toggleAttribute("data-scroll-lock", hide);
  if (isScrollLocked()) getLenis()?.stop();
  else getLenis()?.start();
}
