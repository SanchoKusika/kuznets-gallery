// What stands in P6's showroom (final screen px, after the pull-back to 0.72; the room's walls are `showroom` in
// promo.ts, the grid wall is SHOWROOM_GRID). Elements in the line-room style: drawn in a sweep, living after. Solid
// things are filled with paper, so the room's lines behind them stop at their edges.

import { LEAN_BAND, ROOM, SHOWROOM_PHOTOS } from "./promo";
import { circle, ellipse, leaf, rr, sway, type Element } from "./shapes";

const F = ROOM.y1;

/** Ceiling spots aimed at the grid wall (none under the grille in the middle). */
export const SHOWROOM_SPOTS = [330, 560, 1360, 1590];

const spot = (x: number) => `M${x} 0V30M${x - 13} 30H${x + 13}L${x + 19} 62H${x - 19}L${x - 13} 30`;

/** The easel's canvas window (screen px): the scene puts a work there. */
export const EASEL_CANVAS = { x: 1626, y: 676, w: 118, h: 150 };

export const showroomElements: Element[] = [
  ...SHOWROOM_SPOTS.map((x) => ({ d: spot(x) })),
  // A tall plant in the left corner, in front of the side wall's edge.
  {
    d: `M52 ${F + 52}L44 ${F - 10}H128L120 ${F + 52}Z` + leaf(86, F - 10, -30, 170, 28) + leaf(86, F - 10, 2, 220, 26) + leaf(86, F - 10, 24, 150, 26) + leaf(86, F - 10, -58, 110, 20),
    fill: true,
    motion: (b) => ({ rotate: sway(1.6, 3)(b), pivot: [86, F - 10] }),
  },
  // A step ladder leaning on the wall left of the grid.
  { d: `M176 ${F}L214 420M296 ${F}L262 420M214 420H262` + [1, 2, 3, 4, 5, 6, 7, 8].map((k) => { const y = F - k * 66; const u = (F - y) / (F - 420); return `M${(176 + 38 * u).toFixed(1)} ${y}H${(296 - 34 * u).toFixed(1)}`; }).join("") },
  // Canvas rolls lying on the floor.
  { d: rr(380, F - 34, 190, 34, 17) + ellipse(397, F - 17, 7, 16) + rr(410, F - 64, 150, 30, 15) + ellipse(425, F - 49, 6, 14), fill: true },
  // The leaning frames with small works (their windows are SHOWROOM_PHOTOS).
  ...SHOWROOM_PHOTOS.map((p) => ({ d: rr(p.x - LEAN_BAND, p.y - LEAN_BAND, p.w + 2 * LEAN_BAND, p.h + 2 * LEAN_BAND, 2), fill: true })),
  // Kraft boxes with the gallery's yellow squares, stacked.
  { d: rr(1372, F - 58, 132, 58, 4) + rr(1392, F - 104, 92, 46, 4) + `M1438 ${F - 58}V${F}M1438 ${F - 104}V${F - 58}`, fill: true },
  { d: rr(1452, F - 40, 16, 16, 1) + rr(1472, F - 40, 16, 16, 1), fine: true },
  // Easel with a canvas on it, right of the grid.
  { d: `M1622 ${F}L1680 600M1748 ${F}L1690 600M1685 ${F - 6}L1686 640M1616 832H1754M1680 600L1685 588L1690 600` },
  // A frame on the right side wall, swinging a little on its nail.
  { d: `M1832 330L1846 300L1860 330` + circle(1846, 298, 4), motion: (b) => ({ rotate: sway(2, 2, 0.3)(b), pivot: [1846, 298] }) },
  {
    d: `M1808 330L1880 336L1880 520L1808 526Z` + `M1820 344L1868 348L1868 508L1820 512Z`,
    fill: true,
    motion: (b) => ({ rotate: sway(2, 2, 0.3)(b), pivot: [1846, 298] }),
  },
];
