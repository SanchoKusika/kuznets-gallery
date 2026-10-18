import type { LineArt } from "./types";

// Promo line drawings (brief 5.3, 6.2, 8). Authored in screen px of the 1920 × 1080 frame, never
// scaled, so the stroke stays stroke.promo (2.5 px). Strokes only: no fills, round caps and joins.

type Pt = { x: number; y: number };

const n1 = (v: number) => +v.toFixed(1);

/** Rounded rect as one closed subpath, clockwise from the top-left corner. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}` +
  `H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

/** Plain rect, clockwise from the top-left corner. */
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;

/** Circle starting at its top, clockwise. */
const circle = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}A${r} ${r} 0 0 1 ${cx} ${cy - r}`;

/** Polyline through points (closed with Z when asked). */
const poly = (pts: Pt[], close = false) => pts.map((p, i) => `${i ? "L" : "M"}${n1(p.x)} ${n1(p.y)}`).join("") + (close ? "Z" : "");

// ─── P3: halls ────────────────────────────────────────────────────────────────────────────────

/**
 * One hall = one 1920-wide screen (P3). Works hang on the eye line; the museum label sits to the
 * right of each work, its top just below the eye line. Works ≈ 320 px square leave a 220 px gap,
 * enough for a 172 px label column («холст на подрамнике» at 16 px is ≈ 160 px).
 * The interior is drawn under the works, in the band y 700–1000 (box at `interior.x/y`).
 */
export const HALL = {
  width: 1920,
  eyeY: 450,
  /** Recommended work size on screen (all hall works are ≈ square); allowed height 300–420. */
  work: { w: 320, h: 320, minH: 300, maxH: 420 },
  slots: [
    { cx: 330, cy: 450 },
    { cx: 870, cy: 450 },
    { cx: 1410, cy: 450 },
  ],
  /** Label: left = work's right edge + dx; top = cy + dy; text column width w. */
  label: { dx: 24, dy: 28, w: 172 },
  /** All four interiors share this box (top-left on screen). Floor line at box y 262 (screen 962). */
  interior: { x: 0, y: 700, w: 1920, h: 300, floorY: 262 },
} as const;

export type HallSlot = (typeof HALL.slots)[number];

/** Work rect for a slot, given the work's on-screen size (centred on the slot). */
export const hallWorkRect = (slot: number, w: number = HALL.work.w, h: number = HALL.work.h) => ({
  x: HALL.slots[slot].cx - w / 2,
  y: HALL.slots[slot].cy - h / 2,
  w,
  h,
});

/** Label's top-left and column width for a slot and the work's on-screen width. */
export const hallLabel = (slot: number, workW: number = HALL.work.w) => {
  const s = HALL.slots[slot];
  const x = s.cx + workW / 2 + HALL.label.dx;
  // The column ends a margin before the next work (540 px between centres).
  return { x, y: s.cy + HALL.label.dy, w: Math.min(HALL.label.w, s.cx + 540 - workW / 2 - HALL.label.dx - x) };
};

// ─── Foreground plants (P2–P3, 1.4× parallax) ───────────────────────────────────────────────

/** Affine placement of a local (u along, v across) point. */
const place = (base: Pt, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (u: number, v: number): Pt => ({ x: base.x + u * c - v * s, y: base.y + u * s + v * c });
};

const fmt = (p: Pt) => `${n1(p.x)} ${n1(p.y)}`;

/** Cubic bezier point (for slit anchors on a leaf edge). */
const bez = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;

/** Monstera leaf: heart-ish outline, midrib, fenestration slits from the edge inward. */
function monsteraLeaf(base: Pt, deg: number, L: number, W: number) {
  const P = place(base, deg);
  // Heart shape: the petiole enters a notch at (0, 0), lobes reach back past it.
  const up = [
    [0, 0],
    [-0.2 * L, -0.45 * W],
    [-0.04 * L, -1.15 * W],
    [0.36 * L, -1.05 * W],
    [0.72 * L, -0.95 * W],
    [0.96 * L, -0.42 * W],
    [L, 0],
  ];
  const q = (i: number, side: number) => fmt(P(up[i][0], up[i][1] * side));
  let d = `M${q(0, 1)}C${q(1, 1)} ${q(2, 1)} ${q(3, 1)}C${q(4, 1)} ${q(5, 1)} ${q(6, 1)}`;
  d += `C${q(5, -1)} ${q(4, -1)} ${q(3, -1)}C${q(2, -1)} ${q(1, -1)} ${q(0, -1)}`;
  d += `M${fmt(P(0.02 * L, 0))}L${fmt(P(0.86 * L, 0))}`;
  // Two deep slits per side, from the edge toward the midrib, leaning to the tip.
  for (const t of [0.45, 0.75]) {
    const seg = t < 0.5 ? 0 : 3;
    const tt = t < 0.5 ? 0.85 : 0.45;
    for (const side of [-1, 1]) {
      const u = bez(up[seg][0], up[seg + 1][0], up[seg + 2][0], up[seg + 3][0], tt);
      const v = bez(up[seg][1], up[seg + 1][1], up[seg + 2][1], up[seg + 3][1], tt) * side;
      d += `M${fmt(P(u, v))}Q${fmt(P(u + 0.04 * L, v * 0.55))} ${fmt(P(u + 0.14 * L, v * 0.3))}`;
    }
  }
  return d;
}

/** Pot: rim and tapered body, standing on y = bottom. */
const pot = (cx: number, top: number, bottom: number, rimW: number, baseW: number) =>
  rr(cx - rimW / 2, top, rimW, 24, 4) + `M${cx - rimW / 2 + 12} ${top + 24}L${cx - baseW / 2} ${bottom}H${cx + baseW / 2}L${cx + rimW / 2 - 12} ${top + 24}`;

/**
 * Monstera in a pot, 480 × 640. Place the box with its bottom on the frame's bottom edge:
 * `y = 1080 - plantA.h`. Parts: pot, stems, leaves.
 */
export const plantA: LineArt = (() => {
  const w = 480;
  const h = 640;
  const cx = 240;
  const soil = 476;
  const leaves: { at: Pt; deg: number; L: number; W: number; c: Pt }[] = [
    { at: { x: 150, y: 250 }, deg: 205, L: 160, W: 64, c: { x: 200, y: 330 } },
    { at: { x: 318, y: 196 }, deg: -22, L: 150, W: 60, c: { x: 270, y: 300 } },
    { at: { x: 226, y: 168 }, deg: -100, L: 150, W: 58, c: { x: 236, y: 300 } },
    { at: { x: 170, y: 372 }, deg: 168, L: 118, W: 46, c: { x: 220, y: 420 } },
    { at: { x: 318, y: 350 }, deg: 12, L: 124, W: 48, c: { x: 262, y: 410 } },
  ];
  return {
    w,
    h,
    roles: ["pot", "stems", "leaves"],
    parts: [
      pot(cx, soil, h, 176, 120),
      leaves.map((l) => `M${cx} ${soil}Q${l.c.x} ${l.c.y} ${l.at.x} ${l.at.y}`).join(""),
      leaves.map((l) => monsteraLeaf(l.at, l.deg, l.L, l.W)).join(""),
    ],
  };
})();

/**
 * Snake plant (sansevieria) in a pot, 300 × 520: upright pointed blades. Bottom on the frame's
 * bottom edge: `y = 1080 - plantB.h`. Parts: pot, blades.
 */
export const plantB: LineArt = (() => {
  const w = 300;
  const h = 520;
  const cx = 150;
  const soil = 394;
  // Blade: base centre x, half width, tip.
  const blades = [
    { x: 100, hw: 11, tip: { x: 38, y: 186 } },
    { x: 124, hw: 12, tip: { x: 92, y: 70 } },
    { x: 150, hw: 13, tip: { x: 160, y: 6 } },
    { x: 176, hw: 12, tip: { x: 214, y: 104 } },
    { x: 200, hw: 11, tip: { x: 264, y: 206 } },
  ];
  const blade = ({ x, hw, tip }: (typeof blades)[number]) => {
    const my = (soil + tip.y) / 2;
    const mx = (x + tip.x) / 2;
    // Widest around a third of the height, then tapering to the point.
    return (
      `M${x - hw} ${soil}C${x - hw * 1.2} ${my + 40} ${mx - hw * 1.1} ${my - 40} ${tip.x} ${tip.y}` +
      `C${mx + hw * 1.1} ${my - 40} ${x + hw * 1.2} ${my + 40} ${x + hw} ${soil}`
    );
  };
  return {
    w,
    h,
    roles: ["pot", "blades"],
    parts: [pot(cx, soil, h, 150, 104), blades.map(blade).join("")],
  };
})();

// ─── P1: empty frames on the dark wall ──────────────────────────────────────────────────────

/** Frame band around the picture: the outline's outer rect is the picture rect grown by this. */
export const FRAME_BAND = 16;

/**
 * Picture rects (screen px) of the five frames in P1, centred on the eye line y 450, salon-style
 * heights (portrait KZ-050 in the middle at 380). The painting fills its rect exactly (it covers
 * the inner line); keyed by code so the hang order can differ from selection.promo.lightFrames.
 */
export const LIGHT_FRAMES_LAYOUT = (() => {
  const items = [
    { code: "KZ-070", w0: 645, h0: 639, h: 230 },
    { code: "KZ-012", w0: 667, h0: 660, h: 290 },
    { code: "KZ-050", w0: 712, h0: 1197, h: 380 },
    { code: "KZ-032", w0: 692, h0: 685, h: 300 },
    { code: "KZ-166", w0: 711, h0: 699, h: 250 },
  ];
  const gap = 56;
  const ws = items.map((it) => Math.round((it.h * it.w0) / it.h0));
  const total = ws.reduce((a, b) => a + b + 2 * FRAME_BAND, 0) + gap * (items.length - 1);
  let x = Math.round((1920 - total) / 2) + FRAME_BAND;
  return items.map((it, i) => {
    const r = { code: it.code, x, y: Math.round(450 - it.h / 2), w: ws[i], h: it.h };
    x += ws[i] + 2 * FRAME_BAND + gap;
    return r;
  });
})();

/** Nail, wire to the frame's top corners, outer frame, inner line. */
const hungFrame = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
  const b = FRAME_BAND;
  const top = y - b;
  const nailY = top - 52;
  const cx = x + w / 2;
  return (
    circle(cx, nailY, 3) +
    `M${x - b + 26} ${top}L${cx} ${nailY + 3}L${x + w + b - 26} ${top}` +
    rect(x - b, top, w + 2 * b, h + 2 * b) +
    rect(x, y, w, h)
  );
};

/** Five empty frames (full-frame box 1920 × 1080 at 0, 0), one part per frame, left to right. */
export const lightFrames: LineArt = {
  w: 1920,
  h: 1080,
  roles: LIGHT_FRAMES_LAYOUT.map((f) => f.code),
  parts: LIGHT_FRAMES_LAYOUT.map(hungFrame),
};


// ─── P6: showroom ────────────────────────────────────────────────────────────────────────────

/** Grid wall after the zoom-out (11 × 6 tiles of 150 + 12 at scale 0.72, centred). */
export const SHOWROOM_GRID = { x: 323, y: 194, w: 1274, h: 691 } as const;

/** Back wall corners of the room (screen px, final). Vanishing point at the frame centre. */
export const ROOM = { x0: 150, x1: 1770, y0: 112, y1: 1004 } as const;

/** Picture windows (screen px) inside the frames leaning on the floor; the scene puts the photos here. */
export const SHOWROOM_PHOTOS = (() => {
  const items = [
    { code: "KZ-070", cx: 700, w0: 645, h0: 639 },
    { code: "KZ-051", cx: 960, w0: 696, h0: 492 },
    { code: "KZ-049", cx: 1220, w0: 692, h0: 685 },
  ];
  const h = 80;
  const bottom = ROOM.y1 + 8 - 14; // frame stands on the floor just in front of the wall
  return items.map((it) => {
    const w = Math.round((h * it.w0) / it.h0);
    return { code: it.code, x: Math.round(it.cx - w / 2), y: bottom - h, w, h };
  });
})();

/** Frame band of the leaning frames around their photo windows. */
export const LEAN_BAND = 14;

/**
 * Showroom around the grid wall, full-frame box 1920 × 1080 at (0, 0), in final screen coordinates
 * (after the 1 → 0.72 zoom). Nothing enters SHOWROOM_GRID.
 * Parts: room (ceiling and corner lines), floor, ceiling grille. What stands in it is in `showroom.ts` (P6).
 */
export const showroom: LineArt = (() => {
  const { x0, x1, y0, y1 } = ROOM;
  // Lines from the vanishing point (960, 560) through the corners, to the frame edge.
  const vp = { x: 960, y: 560 };
  const toEdge = (p: Pt, edgeX: number): Pt => {
    const t = (edgeX - vp.x) / (p.x - vp.x);
    const y = vp.y + (p.y - vp.y) * t;
    if (y <= 1080) return { x: edgeX, y };
    const t2 = (1080 - vp.y) / (p.y - vp.y);
    return { x: vp.x + (p.x - vp.x) * t2, y: 1080 };
  };
  const tl = toEdge({ x: x0, y: y0 }, 0);
  const tr = toEdge({ x: x1, y: y0 }, 1920);
  const bl = toEdge({ x: x0, y: y1 }, 0);
  const br = toEdge({ x: x1, y: y1 }, 1920);
  const room = poly([tl, { x: x0, y: y0 }, { x: x1, y: y0 }, tr]) + `M${x0} ${y0}V${y1}M${x1} ${y0}V${y1}`;
  const floor = poly([bl, { x: x0, y: y1 }, { x: x1, y: y1 }, br]);

  // Ventilation grille on the ceiling: a perspective slot with slats.
  const g = { back: 84, front: 50, bx0: 800, bx1: 1120, fx0: 776, fx1: 1144 };
  let grille = poly(
    [
      { x: g.fx0, y: g.front },
      { x: g.fx1, y: g.front },
      { x: g.bx1, y: g.back },
      { x: g.bx0, y: g.back },
    ],
    true,
  );
  const slats = 13;
  for (let i = 1; i < slats; i++) {
    const t = i / slats;
    grille += `M${n1(g.fx0 + (g.fx1 - g.fx0) * t)} ${g.front}L${n1(g.bx0 + (g.bx1 - g.bx0) * t)} ${g.back}`;
  }
  return { w: 1920, h: 1080, roles: ["room", "floor", "grille"], parts: [room, floor, grille] };
})();

// ─── P5: arch window ─────────────────────────────────────────────────────────────────────────

/**
 * Central-Asian pointed arch (iwan / Registan window), w × h with its top-left at (x, y): straight
 * jambs, then two curves meeting at a sharp apex. Closed path, starts at the bottom centre and runs
 * clockwise on screen (left, up, apex, right, down) — same start and direction as `circleOutline`,
 * so the circle → arch morph does not twist. Also usable as a clip path.
 */
export function archOutline(w: number, h: number, x = 0, y = 0) {
  const s = 0.66 * w; // depth of the arched head
  const c = x + w / 2;
  return (
    `M${n1(c)} ${n1(y + h)}H${n1(x)}V${n1(y + s)}` +
    `C${n1(x)} ${n1(y + s * 0.5)} ${n1(x + w * 0.34)} ${n1(y + s * 0.2)} ${n1(c)} ${n1(y)}` +
    `C${n1(x + w * 0.66)} ${n1(y + s * 0.2)} ${n1(x + w)} ${n1(y + s * 0.5)} ${n1(x + w)} ${n1(y + s)}` +
    // Back to the start explicitly (no Z: a trailing Z breaks point sampling for the morph).
    `V${n1(y + h)}H${n1(c)}`
  );
}

/** Circle of radius r in a 2r box at (x, y): starts at the bottom centre, clockwise on screen. */
export function circleOutline(r: number, x = 0, y = 0) {
  const cx = x + r;
  const cy = y + r;
  return (
    `M${n1(cx)} ${n1(cy + r)}A${r} ${r} 0 0 1 ${n1(cx - r)} ${n1(cy)}A${r} ${r} 0 0 1 ${n1(cx)} ${n1(cy - r)}` +
    `A${r} ${r} 0 0 1 ${n1(cx + r)} ${n1(cy)}A${r} ${r} 0 0 1 ${n1(cx)} ${n1(cy + r)}`
  );
}

/** P5: the circle of the montage and the arch it morphs into, centred on the frame. */
export const ARCH = { w: 380, h: 640, circleR: 240, cx: 960, cy: 540 } as const;
