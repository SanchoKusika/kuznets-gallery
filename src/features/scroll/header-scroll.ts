/** Scroll offset past which the classic header shrinks (Header.module.scss). */
const SHRINK_AT = 40;
const SCROLLED = "data-scrolled";
const INSTANT = "data-scroll-instant";

const root = () => document.documentElement;

/** `html[data-scrolled]` while the page is scrolled past the header's threshold. */
export function syncScrolled() {
  root().toggleAttribute(SCROLLED, scrollY > SHRINK_AT);
}

/** The same at once, without the header's shrink transition (for a 2-frame window). */
export function syncScrolledInstantly() {
  root().setAttribute(INSTANT, "");
  syncScrolled();
  requestAnimationFrame(() => requestAnimationFrame(() => root().removeAttribute(INSTANT)));
}
