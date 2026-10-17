import type { LineArt } from "./types";

// Reels line drawings (brief 6.2, 7). Authored in screen px of the 1080 × 1920 frame.
//
// Interiors: box 1080 × 460, placed at (0, 1240) — the band y 1240–1700. Floor at box y ≈ 426.
// Each has exactly four parts in the same roles, so part i morphs into part i (brief 6.4), and the
// parts are laid out so that the big shapes travel short distances in home → kids → office → cafe:
//   part 0 — the big piece, centre-left (sofa → bed → desk → table);
//   part 1 — tall thing on the right (floor lamp → shelf → chair → cup 1);
//   part 2 — small object at centre-right (cushions → rocket → desk lamp → cup 2);
//   part 3 — low / floor element (rug → rug → laptop → steam).
// The picture hangs above the furniture: the frames (screen px) are home 620² (y 600–1220),
// kids 420 × 830 (x 330–750, y 600–1430 → box y ≤ 190), office 820 × 482, cafe 620².

export const INTERIOR = { x: 0, y: 1240, w: 1080, h: 460 } as const;

const W = INTERIOR.w;
const H = INTERIOR.h;

/** Rounded rect as one closed subpath, drawn clockwise from the top-left corner. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}` +
  `H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}`;

// Circles and ellipses are cubic Béziers, not arcs: arc lengths go through trig, which can differ in
// the last bit between Node and the render browser, and MorphLines' resampling at the very end of a
// subpath then finds no point. Bézier lengths use only arithmetic and sqrt, so they match everywhere.
const K = 0.5523;

/** Ellipse as one subpath of four cubics, clockwise from its top. */
const ellipseTop = (cx: number, cy: number, rx: number, ry: number) => {
  const kx = +(rx * K).toFixed(1);
  const ky = +(ry * K).toFixed(1);
  return (
    `M${cx} ${cy - ry}C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}` +
    `C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}` +
    `C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}` +
    `C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}`
  );
};

/** Circle as one subpath starting at its top. */
const circle = (cx: number, cy: number, r: number) => ellipseTop(cx, cy, r, r);

/** Ellipse starting at its left end (where the pen enters a rug). */
const ellipse = (cx: number, cy: number, rx: number, ry: number) => {
  const kx = +(rx * K).toFixed(1);
  const ky = +(ry * K).toFixed(1);
  return (
    `M${cx - rx} ${cy}C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}` +
    `C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}` +
    `C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}` +
    `C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}`
  );
};

/** Throw cushion: a square with softly pinched sides. */
const cushion = (cx: number, cy: number, s: number) => {
  const a = s / 2;
  const p = s * 0.12;
  return (
    `M${cx - a} ${cy - a}Q${cx} ${cy - a + p} ${cx + a} ${cy - a}Q${cx + a - p} ${cy} ${cx + a} ${cy + a}` +
    `Q${cx} ${cy + a - p} ${cx - a} ${cy + a}Q${cx - a + p} ${cy} ${cx - a} ${cy - a}`
  );
};

/* ── Home: sofa / floor lamp / cushions / rug ─────────────────────────────────────────────────── */
// Closed shapes are closed by a line back to the start, not `Z`: MorphLines resamples by length and
// a `Z` subpath returns no point at its very end.
// Subpaths are ordered for the morph too (subpath j of part i pairs with subpath j of the next
// interior), so similar strokes travel together: body → mattress → desk top → table top, etc.

export const reelsHome: LineArt = {
  w: W,
  h: H,
  roles: ["sofa", "floor lamp", "cushions", "rug"],
  parts: [
    // Arms and seat in one stroke, backrest, seam, legs.
    "M290 384V314Q290 292 310 292Q330 292 330 314V340H730V314Q730 292 750 292Q770 292 770 314V384Q770 394 760 394H300Q290 394 290 384" +
      "M330 336V252Q330 224 358 224H702Q730 224 730 252V336" +
      "M530 228V338" +
      "M318 394V414M742 394V414",
    // Shade, pole, foot.
    "M852 64H908L938 136H822L852 64" + "M880 136V422" + "M848 424Q880 412 912 424",
    cushion(394, 302, 66) + cushion(668, 302, 66),
    ellipse(522, 426, 316, 20),
  ],
};

/* ── Kids: bed / shelf with a toy / rocket / rug ──────────────────────────────────────────────── */

export const reelsKids: LineArt = {
  w: W,
  h: H,
  roles: ["bed", "shelf with a toy", "toy rocket", "rug"],
  parts: [
    // Mattress and frame, pillow, blanket fold, headboard, foot — low and left, clear of the frame.
    "M152 344H490Q502 344 502 356V388H152" +
      "M170 344Q168 318 194 318H246Q270 318 268 344" +
      "M320 344Q312 366 322 388" +
      "M112 424V266Q112 246 132 246Q152 246 152 266V424" +
      "M502 388V424",
    // Teddy's body, the shelf board and brackets, head and ears, a ball.
    circle(864, 131, 21) + "M790 152H1000" + "M814 152V176L838 152" + "M976 152V176L952 152" +
      circle(864, 97, 15) + circle(851, 80, 6) + circle(877, 80, 6) + circle(946, 135, 17),
    // Body with the nose cone, porthole, fins, nozzle.
    "M618 392V322Q618 280 650 246Q682 280 682 322V392H618" + circle(650, 318, 12) +
      "M618 352L596 388V418L618 400" + "M682 352L704 388V418L682 400" + "M636 392V404H664V392",
    ellipse(560, 430, 330, 20),
  ],
};

/* ── Office: desk (with the floor) / chair / desk lamp / laptop ───────────────────────────────── */

export const reelsOffice: LineArt = {
  w: W,
  h: H,
  roles: ["desk and floor", "chair", "desk lamp", "laptop"],
  parts: [
    // Top, drawer unit and handle, legs, floor.
    rr(186, 222, 528, 16, 4) + "M566 238V330H688" + "M610 284H644" + "M212 238V424" + "M688 238V424" + "M110 426H990",
    // Back pad, seat, base, column, stem, casters.
    rr(872, 172, 32, 98, 14) + rr(748, 296, 152, 16, 8) + "M766 408L824 390L882 408" + "M824 312V390" + "M888 270V296" +
      circle(766, 418, 7) + circle(882, 418, 7),
    // Arms, shade, base, joint.
    "M640 208L604 142L654 96" + "M648 90L664 80L712 116Q698 140 668 148L648 90" + "M608 222Q608 208 622 208H658Q672 208 672 222" +
      circle(604, 142, 6),
    // Screen, then the base it sits on.
    rr(316, 124, 132, 84, 6) + "M296 214H468",
  ],
};

/* ── Cafe: table / cup / cup / steam ──────────────────────────────────────────────────────────── */

export const reelsCafe: LineArt = {
  w: W,
  h: H,
  roles: ["cafe table", "cup 1", "cup 2", "steam"],
  parts: [
    // Top, apron, collar, pedestal, foot, floor, then a bistro chair either side facing the table.
    rr(364, 220, 352, 16, 8) + "M396 236Q540 250 684 236" + "M526 252H554" + "M540 244V410" + "M474 426Q540 398 606 426" + "M110 426H990" +
      "M196 426L208 214Q210 196 226 198" + rr(202, 292, 112, 12, 6) + "M302 304L312 426" +
      "M884 426L872 214Q870 196 854 198" + rr(766, 292, 112, 12, 6) + "M778 304L768 426",
    // Cup, saucer, handle facing out.
    "M444 168H496V194Q496 214 476 214H464Q444 214 444 194V168" + "M428 220H512" + "M444 178Q428 178 428 190Q428 202 444 202",
    // Taller mug, handle on the other side.
    "M584 150H632V204Q632 218 618 218H598Q584 218 584 204V150" + "M632 164Q650 164 650 180Q650 196 632 196",
    // Two wisps, one over each cup.
    "M470 152Q458 136 470 120Q482 104 470 88" + "M608 134Q596 118 608 102Q620 86 608 70",
  ],
};

/** Interiors in Reels order (R3). */
export const REELS_INTERIORS = [reelsHome, reelsKids, reelsOffice, reelsCafe] as const;

/* ── Nail and wire ────────────────────────────────────────────────────────────────────────────── */

/**
 * Nail under its head. The head is the 18 px accent dot drawn by the scene at `anchor`; this adds the
 * shank peeking out below it and a short shadow stroke to the lower right (draw it in ink-4 or at
 * reduced opacity). Place the box at (540 − anchor.x, 540 − anchor.y).
 */
export const nail = {
  anchor: { x: 20, y: 16 },
  art: {
    w: 48,
    h: 48,
    parts: ["M20 22L21 30", "M29 25Q34 30 40 32"],
    roles: ["shank", "shadow"],
  } satisfies LineArt,
} as const;

type Pt = { x: number; y: number };

/**
 * Hanging wire: left top corner of the frame → nail → right top corner (one stroke, so evolvePath
 * draws it from the frame up to the nail and down again). `angle` (deg, clockwise) swings the frame
 * corners around the nail for the pendulum; with the frame rotated by the same angle about the nail
 * the wire stays attached. Screen px.
 */
export function wirePath(nailAt: Pt, frame: { x: number; y: number; w: number; h: number }, angle = 0) {
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const rot = (p: Pt) => ({
    x: nailAt.x + (p.x - nailAt.x) * cos - (p.y - nailAt.y) * sin,
    y: nailAt.y + (p.x - nailAt.x) * sin + (p.y - nailAt.y) * cos,
  });
  const l = rot({ x: frame.x, y: frame.y });
  const r = rot({ x: frame.x + frame.w, y: frame.y });
  const p = (q: Pt) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  return `M${p(l)}L${p(nailAt)}L${p(r)}`;
}
