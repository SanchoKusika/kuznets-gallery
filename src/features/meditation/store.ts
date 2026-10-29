"use client";

import { useSyncExternalStore } from "react";

let opened = false;
const listeners = new Set<() => void>();

const set = (value: boolean) => {
  if (value === opened) return;
  opened = value;
  listeners.forEach((l) => l());
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Whether the meditation mode is on: the hotkey, the link on the work page and the mode itself share it. */
export const useMeditationOpen = () => useSyncExternalStore(subscribe, () => opened, () => false);

export const meditation = {
  open: () => set(true),
  close: () => set(false),
};
