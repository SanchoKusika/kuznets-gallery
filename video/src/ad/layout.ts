import type { CSSProperties } from "react";
import { fonts } from "../theme/fonts";
import { bold } from "../theme/tokens";

// The Ad reel (1080×1920, 120 BPM, 30 beats = 15 s): scene starts in beats and the positions two scenes share.

export const AD_BPM = 120;
export const AD_BEATS = 30;

/** Scene starts, beats. */
export const AD = {
  hook: 0,
  wall: 4,
  rooms: 8,
  formats: 12,
  custom: 16,
  montage: 19,
  logo: 24,
} as const;

/** Text column (inside the Reels safe zone x 65–1015, y 270–1250). */
export const TEXT_X = 72;
export const TEXT_Y = 300;

/** The big picture of A1, which shrinks into its tile of the A2 wall. */
export const HERO = { code: "KZ-022", x: 540, y: 1122, size: 600 } as const;

/** A1's small pictures around the hero; A2 picks them up from here into their tiles. */
export const SMALLS = [
  { code: "KZ-010", x: 196, y: 870, size: 240, rot: -7, tile: [0, 0] },
  { code: "KZ-097", x: 900, y: 812, size: 220, rot: 8, tile: [2, 0] },
  { code: "KZ-069", x: 872, y: 1540, size: 236, rot: 5, tile: [2, 2] },
] as const;

/** A2 wall: 3 columns × 4 rows of 300 px tiles from y 648 (the rows above hold the counter). */
export const TILE = 300;
export const GAP = 24;
export const COLS = 3;
export const ROWS = 4;
export const GRID_X0 = (1080 - (COLS * TILE + (COLS - 1) * GAP)) / 2;
export const GRID_Y0 = 648;
export const tileCentre = (col: number, row: number) => ({
  x: GRID_X0 + col * (TILE + GAP) + TILE / 2,
  y: GRID_Y0 + row * (TILE + GAP) + TILE / 2,
});

/** A3/A4 picture box. */
export const STAGE = { x: 540, y: 1090, size: 620 } as const;

/** The tile A2 zooms into; its picture opens A3 on STAGE. */
export const ZOOM_TILE = { col: 1, row: 1, code: "KZ-012" } as const; // after the shuffle KZ-012 sits in the centre tile

/** Display type: Onest 800, lower case, very tight. */
export const heavy = (size: number, color: string = bold.ink): CSSProperties => ({
  fontFamily: fonts.sans,
  fontWeight: 800,
  fontSize: size,
  letterSpacing: "-0.055em",
  lineHeight: 0.9,
  color,
  textTransform: "lowercase",
});
