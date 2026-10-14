"use client";

/**
 * Page scroll lock (prototype: `html { overflow: hidden }` while the mobile menu is open).
 * Implemented as `html[data-scroll-lock]` so no inline styles are written.
 */
const owners = new Set<string>();

export function lockScroll(owner: string) {
  owners.add(owner);
  document.documentElement.setAttribute("data-scroll-lock", "");
}

export function unlockScroll(owner: string) {
  owners.delete(owner);
  if (!owners.size) document.documentElement.removeAttribute("data-scroll-lock");
}
