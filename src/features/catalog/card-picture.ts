/**
 * The picture a card already shows, handed to the artwork page it opens: the page shows it under its
 * photo until the photo arrives (its larger WebP copy; a moment on a first view),
 * instead of an empty box. The card's file is the whole picture (the card only crops it), so it
 * fits the photo's frame exactly.
 */
let handoff: { slug: string; src: string } | null = null;

/** A smaller picture (the list view's 88px thumbnail) would only show blurred in the photo's place. */
const MIN_WIDTH = 300;

/** On a plain click on a link to `/work/<slug>`: remembers its picture, if it has loaded and is big enough. */
export function handOff(href: string, img: HTMLImageElement | null) {
  const slug = new URL(href, location.href).pathname.split("/").pop() ?? "";
  handoff = img?.complete && img.naturalWidth >= MIN_WIDTH && img.currentSrc ? { slug, src: img.currentSrc } : null;
}

/** The picture handed over for `code` by the click that opened its page (single use, see `dropHandoff`). */
export const handedOff = (code: string) => (handoff?.slug === code.toLowerCase() ? handoff.src : undefined);

/** Called by the page once it has taken the picture: a later visit by another way gets none. */
export function dropHandoff() {
  handoff = null;
}
