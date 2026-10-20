import type { MouseEvent } from "react";

/** A left click without modifiers: one that navigates in this tab (not a new tab, window or download). */
export const isPlainClick = (e: MouseEvent) => e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);
