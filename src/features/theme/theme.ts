"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./constants";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "light");
}

type Origin = { clientX: number; clientY: number };

/**
 * Toggle with the prototype's circular reveal: the new theme grows from the
 * click point over 750ms (View Transitions API), falling back to an instant switch.
 */
export function toggleTheme(origin?: Origin) {
  const next: Theme = readTheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {}

  const x = origin?.clientX ? origin.clientX : innerWidth - 60;
  const y = origin?.clientY ? origin.clientY : 40;

  let ran = false;
  const commit = () => {
    if (ran) return;
    ran = true;
    applyTheme(next);
  };

  if (
    !document.startViewTransition ||
    document.hidden ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    commit();
    return;
  }

  const vt = document.startViewTransition(commit);
  setTimeout(() => {
    if (!ran) {
      try {
        vt.skipTransition();
      } catch {}
      commit();
    }
  }, 400);

  vt.ready
    .then(() => {
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.6,0,.3,1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
}
