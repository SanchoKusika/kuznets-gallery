import { ViewTransition, type ReactNode } from "react";

/** Transition type of a navigation to an artwork page (WorkLink adds it); `slug` is the code in lower case. */
export const morphType = (slug: string) => `artwork-${slug}`;

/**
 * Shared element between pages: a card's image and the artwork page's photo carry the same name,
 * so on navigation the browser morphs one into the other (`.morph` in globals.scss). Only the
 * artwork being opened morphs (its transition type); the other cards on both pages stay put. It
 * plays when the page arrives in the same commit as the navigation — prefetched, see WorkLink.
 * Outside React navigations (e.g. the theme switch) the name isn't set.
 */
export function ArtworkMorph({ code, children }: { code: string; children: ReactNode }) {
  const slug = code.toLowerCase();
  return (
    <ViewTransition name={`artwork-${slug}`} share={{ [morphType(slug)]: "morph", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}
