import { ViewTransition, type ReactNode } from "react";

/** Transition type of a navigation that opens this artwork from its card (WorkLink `morph`). */
export const morphType = (code: string) => `artwork-${code.toLowerCase()}`;

/**
 * Shared element card → artwork page: the card's image and the page's photo carry the same name, so
 * opening the artwork from its card flies the photo from the card's place, opening up from the
 * card's crop to the whole picture (`.morph` in globals.scss). Only that navigation carries the
 * artwork's type; other cards on both pages and «Следующая работа» don't morph. It plays when the
 * page arrives in the same commit as the navigation — prefetched, see WorkLink. Outside React
 * navigations (the theme switch) no name is set. Back flies the photo home by other means:
 * ArtworkMorphBack.
 */
export function ArtworkMorph({ code, children }: { code: string; children: ReactNode }) {
  // The name and the type happen to read the same; they are different things.
  const name = `artwork-${code.toLowerCase()}`;
  return (
    <ViewTransition name={name} share={{ [morphType(code)]: "morph", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}
