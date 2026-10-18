// Shared pieces of the "living" line rooms (Reels R3, Promo P3, P8): element and motion types and the shape helpers.
// Paths are strings in the room box's px; circles and ellipses are cubic Béziers, so path lengths use plain
// arithmetic and come out the same in Node and the browser.

export type Motion = {
  /** Degrees about `pivot`. */
  rotate?: number;
  pivot?: readonly [number, number];
  dx?: number;
  dy?: number;
  /** Dashes running along the path (steam, light). */
  dash?: { array: string; offset: number };
  opacity?: number;
};

export type Element = {
  d: string;
  /** Idle life once drawn, from the beat count since the act's start. */
  motion?: (beat: number) => Motion;
  /** A finer, lighter stroke (patterns, steam, light rays). */
  fine?: boolean;
  /** Solid: closed shapes are filled with the paper once drawn, so lines behind (the floor's boards) stop at them. */
  fill?: boolean;
};

export const n = (v: number) => +v.toFixed(1);

// Circles and ellipses as cubic Béziers (path lengths then use plain arithmetic, the same in Node and the browser).
const K = 0.5523;
export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)} ${n(cy)}C${n(cx - rx)} ${n(cy - ry * K)} ${n(cx - rx * K)} ${n(cy - ry)} ${n(cx)} ${n(cy - ry)}` +
  `C${n(cx + rx * K)} ${n(cy - ry)} ${n(cx + rx)} ${n(cy - ry * K)} ${n(cx + rx)} ${n(cy)}` +
  `C${n(cx + rx)} ${n(cy + ry * K)} ${n(cx + rx * K)} ${n(cy + ry)} ${n(cx)} ${n(cy + ry)}` +
  `C${n(cx - rx * K)} ${n(cy + ry)} ${n(cx - rx)} ${n(cy + ry * K)} ${n(cx - rx)} ${n(cy)}`;
export const circle = (cx: number, cy: number, r: number) => ellipse(cx, cy, r, r);

/** Rounded rect, clockwise from the top-left corner. */
export const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}` +
  `H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}`;

/** Throw cushion: a square with softly pinched sides and a seam tuft. */
export const cushion = (cx: number, cy: number, s: number, tilt = 0) => {
  const a = s / 2;
  const p = s * 0.13;
  const t = tilt;
  return (
    `M${cx - a} ${cy - a + t}Q${cx} ${cy - a + p} ${cx + a} ${cy - a - t}Q${cx + a - p} ${cy} ${cx + a} ${cy + a - t}` +
    `Q${cx} ${cy + a - p} ${cx - a} ${cy + a + t}Q${cx - a + p} ${cy} ${cx - a} ${cy - a + t}`
  );
};

/** A leaf from its base, pointing at `angle` (deg, 0 = up), length l, half-width w. */
export const leaf = (x: number, y: number, angle: number, l: number, w: number) => {
  const a = (angle * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const tip = [x + ux * l, y + uy * l];
  const side = (s: number) => [x + ux * l * 0.5 + uy * -w * s, y + uy * l * 0.5 + ux * w * s];
  const [l1, r1] = [side(1), side(-1)];
  return `M${n(x)} ${n(y)}Q${n(l1[0])} ${n(l1[1])} ${n(tip[0])} ${n(tip[1])}Q${n(r1[0])} ${n(r1[1])} ${n(x)} ${n(y)}` + `M${n(x)} ${n(y)}L${n(x + ux * l * 0.8)} ${n(y + uy * l * 0.8)}`;
};

/** A soft periodic sway (deg) with its own period and phase, in beats. */
export const sway = (deg: number, period: number, phase = 0) => (b: number) => deg * Math.sin((2 * Math.PI * (b + phase)) / period);

/** Steam: dashes rising along a wisp. */
export const steam = (speed = 24) => (b: number): Motion => ({ dash: { array: "16 12", offset: b * speed }, opacity: 0.9 });
