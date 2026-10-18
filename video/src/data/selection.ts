// Which works go where, by code — change the selection here without touching the scenes.
// Every code is checked against art.json (unknown or excluded → error at load).

import { random } from "remotion";
import { ALLOWED, art } from "./art";
import circlesJson from "./circles.json";

/** Circle inside a work that matches the round mask: centre and radius in source pixels. */
export type Circle = { cx: number; cy: number; r: number };
export const CIRCLES: Record<string, Circle> = circlesJson;

/** n works in a stable pseudo-random order, so series (three «Эко мандала», two «Икат») do not sit side by side. */
const shuffled = (seed: string, n: number) =>
  [...ALLOWED]
    .sort((a, b) => random(`${seed}-${a.code}`) - random(`${seed}-${b.code}`))
    .slice(0, n)
    .map((a) => a.code);

const check = <T extends string | readonly string[]>(codes: T): T => {
  (Array.isArray(codes) ? codes : [codes]).forEach((c) => art(c));
  return codes;
};

/** `code` at `index` of a list (swapped with its old place if it is already there). */
const placeAt = (codes: string[], code: string, index: number) => {
  const out = codes.filter((c) => c !== code).slice(0, codes.length - 1);
  out.splice(index, 0, code);
  return out;
};

/** R4 and P5: one per eighth. */
const CIRCLE_WORKS = check(["KZ-104", "KZ-037", "KZ-172", "KZ-065", "KZ-044", "KZ-038", "KZ-055", "KZ-039"] as const);

/** R5: the tile the last circle work lands in when R4's circle opens onto the wall (the one behind the circle). */
export const WALL_LANDING_TILE = 17;

/** Frame sizes of R3 (brief: kids 420×840 — 420×830 keeps KZ-080 within the 1.1× limit). */
export const reels = {
  /** R2: one per beat; the fifth swings into R3. */
  tryOn: check(["KZ-068", "KZ-037", "KZ-022", "KZ-097", "KZ-015"] as const),
  interiors: [
    { key: "home", code: check("KZ-015"), frame: { w: 620, h: 620 } },
    { key: "kids", code: check("KZ-080"), frame: { w: 420, h: 830 } },
    { key: "office", code: check("KZ-020"), frame: { w: 820, h: 482 } },
    { key: "cafe", code: check("KZ-140"), frame: { w: 620, h: 620 } },
  ] as const,
  /** R4 and P5: one per eighth. */
  circles: CIRCLE_WORKS,
  /** R5: 50 different works (5 × 10); the last circle work sits in the landing tile. */
  wall: placeAt(shuffled("reels-wall", 50), CIRCLE_WORKS[CIRCLE_WORKS.length - 1], WALL_LANDING_TILE),
  /** R6–R8. */
  custom: check("KZ-009"),
};

export const promo = {
  /** P1: in the empty frames once the light comes on. */
  lightFrames: check(["KZ-012", "KZ-070", "KZ-032", "KZ-166", "KZ-050"] as const),
  halls: [
    { key: "home", codes: check(["KZ-011", "KZ-047", "KZ-035"] as const), hover: "KZ-011" },
    { key: "kids", codes: check(["KZ-082", "KZ-086", "KZ-097"] as const), hover: null },
    { key: "office", codes: check(["KZ-134", "KZ-129", "KZ-111"] as const), hover: "KZ-134" },
    { key: "public", codes: check(["KZ-140", "KZ-143", "KZ-137"] as const), hover: null },
  ] as const,
  /** P4: first 14 unique titles of the catalogue (without excluded works). */
  ribbonTitles: [...new Set(ALLOWED.map((a) => a.title))].slice(0, 14),
  circles: reels.circles,
  arch: check(["KZ-028", "KZ-112", "KZ-160", "KZ-162"] as const),
  /** P6: 11 × 6 grid. */
  wall: shuffled("promo-wall", 66),
  showroom: check(["KZ-070", "KZ-051", "KZ-049"] as const),
  /** P7 (brief: KZ-041 Адрас; the owner asked for a more striking work). */
  craft: check("KZ-022"),
  custom: check("KZ-009"),
};
