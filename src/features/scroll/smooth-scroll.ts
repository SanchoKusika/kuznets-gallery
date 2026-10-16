"use client";

import type Lenis from "lenis";

/** The site's Lenis instance while <SmoothScroll> is mounted (null with reduced motion). */
let lenis: Lenis | null = null;

export const getLenis = () => lenis;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

/** Scroll position at which the footer starts right under the sticky header. */
function contactsTop() {
  const footer = document.getElementById("contacts");
  if (!footer) return document.body.scrollHeight;
  const header = document.querySelector("header");
  return footer.getBoundingClientRect().top + scrollY - (header?.offsetHeight ?? 0);
}

/**
 * "Контакты": smooth-scroll to the start of the footer, under the header (prototype: 60ms after
 * the menu has closed — the header calls this only once the menu is gone). Without Lenis
 * (reduced motion) the browser's smooth scroll does it. The header shrinks once the page leaves
 * the top, so the target is taken again mid-way — the second call just retargets the scroll.
 */
export function scrollToContacts() {
  const go = () => {
    const top = contactsTop();
    if (lenis && !lenis.isStopped) lenis.scrollTo(top);
    else window.scrollTo({ top, behavior: "smooth" });
  };
  setTimeout(() => {
    go();
    setTimeout(go, 450);
  }, 60);
}
