/**
 * The picture a card already shows, handed to the artwork page it opens. The page's own photo is
 * larger and comes from the image optimizer — up to a couple of seconds on a first view — so
 * without it the morph would land on an empty box and the photo would pop in later. The card's
 * file is the whole picture (the card only crops it), so it fits the photo's frame exactly; its
 * ratio lets the page size the morph's target to the picture itself (no empty margins in it).
 */
export type Handoff = { src: string; ratio: number };

let handoff: (Handoff & { code: string }) | null = null;

/** Remembers the card's picture of `code` (on click), if it has loaded. */
export function handOff(code: string, img: HTMLImageElement | null) {
  handoff =
    img?.complete && img.currentSrc && img.naturalHeight
      ? { code, src: img.currentSrc, ratio: img.naturalWidth / img.naturalHeight }
      : null;
}

/** The picture handed over for `code` by the click that opened its page (single use, see `dropHandoff`). */
export const handedOff = (code: string): Handoff | undefined =>
  handoff?.code === code ? { src: handoff.src, ratio: handoff.ratio } : undefined;

/** Called by the page once it has taken the picture: a later visit by another way gets none. */
export function dropHandoff() {
  handoff = null;
}
