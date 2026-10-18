// What stands in P6's showroom (final screen px, after the pull-back to 0.72; the room's walls are `showroom` in
// promo.ts, the grid wall is SHOWROOM_GRID). One-point perspective: the vanishing point is the room's (960, 560), so
// every line going into depth — floor boards, the rug's sides, the side walls' frames and door — runs through it,
// and what is parallel to the back wall stays horizontal / vertical. Elements in the line-room style: drawn in a
// sweep, living after; solid things are filled with paper, so the lines behind them stop at their edges.

import { LEAN_BAND, ROOM, SHOWROOM_PHOTOS } from "./promo";
import { ellipse, leaf, n, rr, sway, type Element } from "./shapes";

const VP = { x: 960, y: 560 };
const F = ROOM.y1;

/** y at screen x of the line through the vanishing point that has height y0 at x0 (a horizontal line in depth). */
const depthY = (x0: number, y0: number, x: number) => VP.y + ((y0 - VP.y) * (x - VP.x)) / (x0 - VP.x);
/** x at screen y of the line through the vanishing point that passes (x0, y0) (a line on the floor into depth). */
const depthX = (x0: number, y0: number, y: number) => VP.x + ((x0 - VP.x) * (y - VP.y)) / (y0 - VP.y);

/**
 * A rectangle on a side wall: its far edge at screen x `far` spans y0–y1, its near edge at `near` (toward the
 * viewer) follows the perspective. `inset` > 0 adds an inner line (a frame's picture window).
 */
function sideRect(far: number, near: number, y0: number, y1: number, inset = 0) {
  const q = (a: number, b: number, t0: number, t1: number) =>
    `M${n(a)} ${n(depthY(far, t0, a))}L${n(b)} ${n(depthY(far, t0, b))}L${n(b)} ${n(depthY(far, t1, b))}L${n(a)} ${n(depthY(far, t1, a))}L${n(a)} ${n(depthY(far, t0, a))}`;
  let d = q(far, near, y0, y1);
  if (inset) {
    const dir = Math.sign(near - far);
    d += q(far + dir * inset, near - dir * inset, y0 + inset, y1 - inset);
  }
  return d;
}

/** The ceiling rail (parallel to the back wall) and the spots on it, aimed at the grid wall. */
export const RAIL_Y = 40;
export const SHOWROOM_SPOTS = [330, 560, 1360, 1590];
const railX0 = depthX(ROOM.x0, ROOM.y0, RAIL_Y);
const railX1 = depthX(ROOM.x1, ROOM.y0, RAIL_Y);
const spot = (x: number) => `M${x} ${RAIL_Y}V${RAIL_Y + 10}M${x - 12} ${RAIL_Y + 10}H${x + 12}L${x + 18} ${RAIL_Y + 40}H${x - 18}L${x - 12} ${RAIL_Y + 10}`;

/** The easel's canvas window (screen px): the scene puts a work there. */
export const EASEL_CANVAS = { x: 1626, y: 690, w: 118, h: 150 };

/** Floor boards: from the back wall's foot towards the viewer, every 90 px along the wall. */
const boards = (() => {
  let d = "";
  for (let x = ROOM.x0 + 90; x < ROOM.x1; x += 90) d += `M${x} ${F}L${n(depthX(x, F, 1080))} 1080`;
  return d;
})();

/** Rug in front of the wall: its back edge parallel to the wall, its sides running into depth. */
const RUG = { x0: 600, x1: 1320, back: 1018, front: 1076 };
const rug =
  `M${RUG.x0} ${RUG.back}H${RUG.x1}L${n(depthX(RUG.x1, RUG.back, RUG.front))} ${RUG.front}H${n(depthX(RUG.x0, RUG.back, RUG.front))}Z` +
  `M${RUG.x0 + 30} ${RUG.back + 10}H${RUG.x1 - 30}L${n(depthX(RUG.x1 - 30, RUG.back + 10, RUG.front - 10))} ${RUG.front - 10}H${n(depthX(RUG.x0 + 30, RUG.back + 10, RUG.front - 10))}Z`;

export const showroomElements: Element[] = [
  { d: boards, fine: true },
  { d: `M${n(railX0)} ${RAIL_Y}H${n(railX1)}` },
  ...SHOWROOM_SPOTS.map((x) => ({ d: spot(x), fill: true })),
  // Side walls: two frames on the left, a frame and a door on the right — all in perspective.
  { d: sideRect(ROOM.x0 - 16, 30, 300, 470, 12), fill: true },
  { d: sideRect(ROOM.x0 - 16, 76, 540, 640, 10), fill: true },
  { d: sideRect(ROOM.x1 + 22, 1876, 330, 520, 12), fill: true },
  { d: sideRect(ROOM.x1 + 60, 1916, 600, F - 4) + `M${n(1916)} ${n(depthY(ROOM.x1 + 60, 600, 1916))}V${n(depthY(ROOM.x1 + 60, F - 4, 1916))}` },
  // Rug and floor in front.
  { d: rug, fill: true, fine: true },
  // A tall plant in the left corner, in front of the side wall's edge.
  {
    d: `M52 ${F + 52}L44 ${F - 10}H128L120 ${F + 52}Z` + leaf(86, F - 10, -30, 170, 28) + leaf(86, F - 10, 2, 220, 26) + leaf(86, F - 10, 24, 150, 26) + leaf(86, F - 10, -58, 110, 20),
    fill: true,
    motion: (b) => ({ rotate: sway(1.6, 3)(b), pivot: [86, F - 10] }),
  },
  // A step ladder leaning on the wall left of the grid.
  {
    d:
      `M176 ${F}L214 420M296 ${F}L262 420M214 420H262` +
      [1, 2, 3, 4, 5, 6, 7, 8]
        .map((k) => {
          const y = F - k * 66;
          const u = (F - y) / (F - 420);
          return `M${n(176 + 38 * u)} ${y}H${n(296 - 34 * u)}`;
        })
        .join(""),
  },
  // A frame waiting on the ladder's step.
  { d: rr(206, 700, 84, 64, 2) + rr(214, 708, 68, 48, 1), fill: true },
  // Canvas rolls lying on the floor.
  { d: rr(380, F - 34, 190, 34, 17) + ellipse(397, F - 17, 7, 16) + rr(410, F - 64, 150, 30, 15) + ellipse(425, F - 49, 6, 14), fill: true },
  // The leaning frames with small works (their windows are SHOWROOM_PHOTOS).
  ...SHOWROOM_PHOTOS.map((p) => ({ d: rr(p.x - LEAN_BAND, p.y - LEAN_BAND, p.w + 2 * LEAN_BAND, p.h + 2 * LEAN_BAND, 2), fill: true })),
  // Kraft boxes with the gallery's yellow squares, stacked.
  { d: rr(1372, F - 58, 132, 58, 4) + rr(1392, F - 104, 92, 46, 4) + `M1438 ${F - 58}V${F}M1438 ${F - 104}V${F - 58}`, fill: true },
  { d: rr(1452, F - 40, 16, 16, 1) + rr(1472, F - 40, 16, 16, 1), fine: true },
  // Easel, standing a little in front of the wall.
  { d: `M1620 ${F + 22}L1680 612M1750 ${F + 22}L1690 612M1685 ${F + 4}L1686 650M1612 848H1758M1680 612L1685 600L1690 612` },
  // A small round table in front, right, with a catalogue and a cup.
  { d: ellipse(1530, 1010, 58, 11) + `M1530 1021V1062M1500 1066H1560` + rr(1496, 988, 42, 12, 2) + `M1546 999V985H1568V999`, fill: true },
];
