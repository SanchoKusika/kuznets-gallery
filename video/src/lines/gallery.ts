// P1's gallery in line (world px of the first screen): spots over the frames, a museum bench and two pairs of
// stanchions with ropes on the floor in front. The floor itself is the scene's (FloorPlane): solid things here are
// filled with paper so the floor's boards do not run through them.

import { LIGHT_FRAMES_LAYOUT, FRAME_BAND } from "./promo";
import { circle, ellipse, rr, type Element } from "./shapes";

/** Where the wall meets the floor (the halls stand on it too). */
export const FLOOR_Y = 962;

/** Spot over each frame: hangs from the ceiling, aimed down at the frame. */
export const SPOTS = LIGHT_FRAMES_LAYOUT.map((f) => ({ x: f.x + f.w / 2, frame: { x: f.x - FRAME_BAND, y: f.y - FRAME_BAND, w: f.w + 2 * FRAME_BAND, h: f.h + 2 * FRAME_BAND } }));

const spot = (x: number) => `M${x} -20V24M${x - 14} 24H${x + 14}L${x + 20} 58H${x - 20}L${x - 14} 24` + `M${x - 8} 58Q${x} 64 ${x + 8} 58`;

/** Stanchion: weighted base, pole, ball top. */
const post = (x: number) => ellipse(x, 1048, 28, 7) + `M${x} 1041V902` + circle(x, 893, 9);

/** Rope between two posts, sagging (`sag` px at the middle). */
export const rope = (x0: number, x1: number, sag: number) => `M${x0 + 8} 904Q${(x0 + x1) / 2} ${904 + 2 * sag} ${x1 - 8} 904`;

export const STANCHIONS = [
  [170, 620],
  [1300, 1750],
] as const;

export const galleryElements: Element[] = [
  ...SPOTS.map((s) => ({ d: spot(s.x) })),
  // Museum bench: a long upholstered seat with tufts on a light frame.
  { d: rr(700, 952, 520, 34, 10) + `M730 986L720 1060M1190 986L1200 1060M726 1030H1194`, fill: true },
  { d: [800, 880, 960, 1040, 1120].map((x) => circle(x, 969, 2.5)).join(""), fine: true },
  ...STANCHIONS.flatMap(([a, b]) => [{ d: post(a), fill: true }, { d: post(b), fill: true }]),
];
