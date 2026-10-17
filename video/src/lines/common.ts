import { coverCrop } from "../primitives/ArtImage";
import type { LineArt } from "./types";

// Drawings shared by Reels and Promo (brief 6.2). All are functions of their on-screen size, so the
// stroke is never scaled: a scene asks for the size it shows and gets paths in those pixels.

const f = (n: number) => +n.toFixed(1);

/* ── Three arches ─────────────────────────────────────────────────────────────────────────────── */

// «Три арки» KZ-009, measured on the source (1080 × 713 px): outer edges of each portal, the
// springing line where the sides start to bend, the apex, and the horizon behind them.
const ARCHES_SRC = { w: 1080, h: 713 };
const ARCHES = [
  { l: 181, r: 372, apex: 37, spring: 112, base: 342 },
  { l: 456, r: 651, apex: 35, spring: 110, base: 340 },
  { l: 737, r: 933, apex: 36, spring: 111, base: 340 },
];
const HORIZON = 309;
// Inset of the niche (the tiled opening) inside each portal, source px.
const NICHE = { side: 26, top: 36, base: 14 };

/**
 * Free-hand sketch of the three arches and the horizon (brief 6.2, R6, P8). Laid out like the
 * painting shown with `ArtImage` (centred cover crop) in the same w × h box, so when the painting
 * fills the sketch the portals and the horizon sit on their lines. Slightly uneven on purpose:
 * overshoots at the corners and a horizon that wanders by a pixel or two.
 * Pen order: horizon left → arch 1 → horizon → arch 2 → horizon → arch 3 → horizon right; each
 * portal is its outline and then its niche.
 */
export function archesSketch(w: number, h: number): LineArt {
  const c = coverCrop(ARCHES_SRC.w, ARCHES_SRC.h, w / h);
  const s = Math.max(w / c.w, h / c.h);
  const X = (x: number) => f((x - c.x) * s);
  const Y = (y: number) => f((y - c.y) * s);
  // Hand wobble in screen px, scaled down a little for small sketches.
  const k = Math.min(1, w / 780);
  const o = (n: number) => f(n * k);

  // Pointed (Persian) arch: straight sides, then two curves meeting at the apex.
  const arch = (l: number, r: number, apex: number, spring: number, base: number, wob: number[]) => {
    const cx = (l + r) / 2;
    const half = (r - l) / 2;
    const [a, b, d, e] = wob;
    return (
      `M${X(l) + o(a)} ${Y(base) + o(7)}` + // starts a touch below the ground: pencil overshoot
      `L${X(l)} ${Y(spring)}` +
      `C${X(l)} ${Y(spring - (spring - apex) * 0.5)} ${X(cx - half * 0.42)} ${Y(apex + (spring - apex) * 0.28)} ${X(cx) + o(b)} ${Y(apex)}` +
      `C${X(cx + half * 0.42)} ${Y(apex + (spring - apex) * 0.28)} ${X(r)} ${Y(spring - (spring - apex) * 0.5)} ${X(r) + o(d)} ${Y(spring)}` +
      `L${X(r) + o(e)} ${Y(base) + o(1)}` +
      // Ground line of the portal, running past its left corner.
      `L${X(l) - o(9)} ${Y(base) + o(2)}`
    );
  };

  const parts: string[] = [];
  const roles: string[] = [];
  const horizon = (x0: number, x1: number, dy0: number, dy1: number) => {
    const mid = (x0 + x1) / 2;
    parts.push(`M${X(x0)} ${Y(HORIZON) + o(dy0)}Q${X(mid)} ${Y(HORIZON) + o((dy0 + dy1) / 2 - 1.5)} ${X(x1)} ${Y(HORIZON) + o(dy1)}`);
    roles.push("horizon");
  };

  const wobbles = [
    [-1, 1, 1.5, 1],
    [1, -1.5, -1, 0],
    [0, 1, 1, -1.5],
  ];
  // Horizon starts a little inside the left edge and stops a hair short of / past each portal.
  const edgeL = c.x + 14 / s;
  const edgeR = c.x + c.w - 14 / s;
  horizon(edgeL, ARCHES[0].l - 3, 1, -0.5);
  ARCHES.forEach((a, i) => {
    parts.push(arch(a.l, a.r, a.apex, a.spring, a.base, wobbles[i]));
    roles.push(`arch ${i + 1}`);
    parts.push(
      arch(a.l + NICHE.side, a.r - NICHE.side, a.apex + NICHE.top, a.spring + NICHE.top * 0.4, a.base - NICHE.base, wobbles[(i + 1) % 3]).replace(
        /L[^L]*$/,
        "", // the niche has no ground line of its own
      ),
    );
    roles.push(`niche ${i + 1}`);
    const next = ARCHES[i + 1];
    if (next) horizon(a.r + 2, next.l - 2, i ? 0.5 : -1, i ? -1 : 1);
  });
  horizon(ARCHES[2].r + 4, edgeR, 0, 1.5);

  return { w, h, parts, roles };
}

/* ── Crop marks ──────────────────────────────────────────────────────────────────────────────── */

/**
 * Printer's crop marks at the corners of a w × h rect, outside it (box = the rect; the marks stick
 * out by gap + len, the svg overflows). Four parts, clockwise from the top-left; each is the
 * horizontal tick, then the vertical one.
 */
export function cropMarks(w: number, h: number, len = 36, gap = 14): LineArt {
  const corner = (x: number, y: number, sx: number, sy: number) =>
    `M${x + sx * (gap + len)} ${y}L${x + sx * gap} ${y}M${x} ${y + sy * (gap + len)}L${x} ${y + sy * gap}`;
  return {
    w,
    h,
    parts: [corner(0, 0, -1, -1), corner(w, 0, 1, -1), corner(w, h, 1, 1), corner(0, h, -1, 1)],
    roles: ["top-left", "top-right", "bottom-right", "bottom-left"],
  };
}

/* ── Check in a circle ───────────────────────────────────────────────────────────────────────── */

/** Lucide `circle-check` drawn at d px: the circle (from the top, clockwise), then the tick. */
export function checkCircle(d: number): LineArt {
  const r = d / 2;
  const u = d / 20; // Lucide's 24-unit icon has a 20-unit circle
  return {
    w: d,
    h: d,
    parts: [
      `M${f(r)} 0A${f(r)} ${f(r)} 0 0 1 ${f(r)} ${d}A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0`,
      `M${f(r - 3 * u)} ${f(r)}L${f(r - u)} ${f(r + 2 * u)}L${f(r + 3 * u)} ${f(r - 2 * u)}`,
    ],
    roles: ["circle", "check"],
  };
}

/* ── Kraft envelope ──────────────────────────────────────────────────────────────────────────── */

/**
 * Back of a kraft envelope, w × h: the outline, the flap (V from the top corners) and the two side
 * folds meeting under it.
 */
export function envelope(w: number, h: number): LineArt {
  const tip = envelopeFlapTip(w, h);
  const r = Math.min(w, h) * 0.03;
  return {
    w,
    h,
    parts: [
      `M${f(r)} 0H${f(w - r)}Q${w} 0 ${w} ${f(r)}V${f(h - r)}Q${w} ${h} ${f(w - r)} ${h}H${f(r)}Q0 ${h} 0 ${f(h - r)}V${f(r)}Q0 0 ${f(r)} 0`,
      `M${f(r * 0.6)} ${f(r * 0.6)}L${f(tip.x - r)} ${f(tip.y - r * 0.6)}Q${f(tip.x)} ${f(tip.y + r * 0.2)} ${f(tip.x + r)} ${f(tip.y - r * 0.6)}L${f(w - r * 0.6)} ${f(r * 0.6)}`,
      `M${f(r * 0.6)} ${f(h - r * 0.6)}L${f(w * 0.4)} ${f(h * 0.5)}M${f(w - r * 0.6)} ${f(h - r * 0.6)}L${f(w * 0.6)} ${f(h * 0.5)}`,
    ],
    roles: ["outline", "flap", "folds"],
  };
}

const envelopeFlapTip = (w: number, h: number) => ({ x: w / 2, y: h * 0.56 });

/**
 * Where the two squares of the logo-wave yellow (`color.logoWave`, filled by the scene) sit on the
 * envelope: side by side on the tip of the flap, like a seal. Box coordinates (top-left + size).
 */
export function envelopeSquares(w: number, h: number) {
  const tip = envelopeFlapTip(w, h);
  const size = f(Math.min(w, h) * 0.13);
  const gap = f(size * 0.22);
  const y = f(tip.y - size * 0.35);
  return [
    { x: f(tip.x - gap / 2 - size), y, size },
    { x: f(tip.x + gap / 2), y, size },
  ];
}
