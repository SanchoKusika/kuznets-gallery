"use client";

import type Lenis from "lenis";

/** The site's Lenis instance while <SmoothScroll> is mounted (null with reduced motion). */
let lenis: Lenis | null = null;

export const getLenis = () => lenis;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

/**
 * Scroll position at which the footer starts right under the sticky header. The header is in
 * flow, so this doesn't change when it shrinks on leaving the top.
 */
function contactsTop() {
  const footer = document.getElementById("contacts");
  if (!footer) return document.body.scrollHeight;
  const header = document.querySelector("header");
  return footer.getBoundingClientRect().top + scrollY - (header?.offsetHeight ?? 0);
}

/**
 * "Контакты": smooth-scroll to the start of the footer, under the header. The prototype scrolls
 * to the page bottom 60ms after it starts closing the menu; here the header calls this once the
 * menu is gone, and the 60ms stay. Without Lenis (reduced motion) or with Lenis stopped by a scroll
 * lock, the browser's smooth scroll does it.
 */
export function scrollToContacts() {
  setTimeout(() => {
    const top = contactsTop();
    if (lenis && !lenis.isStopped) lenis.scrollTo(top);
    else window.scrollTo({ top, behavior: "smooth" });
  }, 60);
}
