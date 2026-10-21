import { getLenis } from "@/features/scroll/smooth-scroll";

/**
 * The collection page the visitor left for an artwork, and where they were in it. «← Коллекция»
 * brings them back there: right after the card's click it goes back in history (the browser
 * restores the grid); after more artworks opened from that one («Ещё», «Следующая работа») it opens
 * the collection again and scrolls to where they were. Going anywhere else ends it.
 */
let opened: { from: string; y: number; first: string | null } | null = null;
/** The scroll position to restore once the collection is shown again. */
let restore: { path: string; y: number } | null = null;

/** On a plain click that opens the artwork `work` (a card's href). */
export function rememberReturn(work: string) {
  const here = location.pathname;
  if (here.startsWith("/collection")) opened = { from: here, y: scrollY, first: work };
  else if (opened && here.startsWith("/work/")) opened = { ...opened, first: null };
  else opened = null;
}

/**
 * «← Коллекция» clicked on `work`: true if it was handled — back in history right after the card's
 * click, otherwise `open(from)` and the position restored once the collection is shown.
 */
export function goBackToCollection(work: string, back: () => void, open: (href: string) => void) {
  if (!opened) return false;
  const { from, y, first } = opened;
  opened = null;
  if (first === work) back();
  else {
    restore = { path: from, y };
    open(from);
  }
  return true;
}

/** Every navigation (NavigationScroll, in the commit): restores the position, ends the return elsewhere. */
export function trackNavigation(pathname: string) {
  if (restore?.path === pathname) {
    const lenis = getLenis();
    // Lenis still knows the artwork page's height (its observer runs later): measure first.
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(restore.y, { immediate: true, force: true });
    }
    else scrollTo(0, restore.y);
  }
  restore = null;
  if (opened && pathname !== opened.from && !pathname.startsWith("/work/")) opened = null;
}
