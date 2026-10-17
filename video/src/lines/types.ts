// Line drawings (brief 5.3, 6.2). Authored in on-screen pixels of their format, inside a box
// w × h whose top-left the scene places on screen: no scaling, so the stroke stays 3 px (Reels)
// or 2.5 px (Promo). Strokes only: no fills, round caps and joins.

export type LineArt = {
  /** Box size in px. */
  w: number;
  h: number;
  /**
   * Subpaths, drawn one after another (the pen goes in this order).
   * Interiors that morph into each other share the same number of parts in the same roles
   * (e.g. furniture / object 1 / object 2 / floor), so part i morphs into part i.
   */
  parts: string[];
  /** Optional names of the parts, same order (for reading the code). */
  roles?: string[];
};
