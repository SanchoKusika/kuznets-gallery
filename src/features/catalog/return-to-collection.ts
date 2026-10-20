/**
 * The collection page an artwork was opened from. «← Коллекция» then goes back in history to it —
 * the browser restores where the visitor was in the grid — instead of opening the collection anew
 * at its top. Only for the artwork opened by that click: after «Следующая работа» it's a plain link.
 */
let opened: { from: string; work: string } | null = null;

/** On a click that opens `work` (a card's href). */
export function rememberReturn(work: string) {
  const from = location.pathname;
  opened = from.startsWith("/collection") ? { from, work } : null;
}

/** The collection page to go back to from `work`, if it was opened from one. */
export const returnFrom = (work: string) => (opened?.work === work ? opened.from : null);

export function forgetReturn() {
  opened = null;
}
