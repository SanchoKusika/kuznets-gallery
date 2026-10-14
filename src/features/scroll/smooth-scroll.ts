"use client";

import type Lenis from "lenis";

/** The site's Lenis instance while <SmoothScroll> is mounted (null with reduced motion). */
let lenis: Lenis | null = null;

export const getLenis = () => lenis;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

/**
 * "Контакты": smooth-scroll to the footer (prototype: 60ms after closing the menu). Lenis is
 * stopped while the menu is still closing, so the native smooth scroll takes over then.
 */
export function scrollToContacts() {
  setTimeout(() => {
    const top = document.body.scrollHeight;
    if (lenis && !lenis.isStopped) lenis.scrollTo(top);
    else window.scrollTo({ top, behavior: "smooth" });
  }, 60);
}
