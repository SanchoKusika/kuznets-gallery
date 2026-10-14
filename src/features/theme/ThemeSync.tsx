"use client";

import { useLayoutEffect } from "react";
import { THEME_KEY } from "./constants";
import { applyTheme, readStoredTheme } from "./theme";

/**
 * Keeps <html data-theme> in sync with storage: re-applies it after React's
 * dev-mode remount clears attributes set by the inline script, and follows
 * changes made in other tabs (the prototype listened to `storage` too).
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) applyTheme(readStoredTheme());
    };
    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
  }, []);
  return null;
}
