// Shapes for the showreel's masks, all morphable into each other without a seam: every shape is described by its
// radius at the same N angles round its centre (they are all star-shaped from the centre), so a morph is just a
// mix of two radius lists and stays a clean closed outline at every frame.

export const N = 180;

type Poly = [number, number][];

/** Distance from the centre to the polygon's edge along angle `a` (largest hit). */
function radial(poly: Poly, a: number) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let best = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const ex = x2 - x1;
    const ey = y2 - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ey - y1 * ex) / den;
    const u = (x1 * dy - y1 * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return best;
}

const angles = Array.from({ length: N }, (_, i) => -Math.PI / 2 + (i / N) * Math.PI * 2);
const fromPoly = (poly: Poly) => angles.map((a) => radial(poly, a));
const regular = (n: number, r: number, rot = 0): Poly => Array.from({ length: n }, (_, i) => [r * Math.cos(rot + (i / n) * Math.PI * 2), r * Math.sin(rot + (i / n) * Math.PI * 2)]);

/** Radius lists of the shapes, for a nominal size of 1 (half-width ≈ 0.5). */
export const SHAPES = {
  circle: angles.map(() => 0.5),
  square: fromPoly([[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]]),
  hexagon: fromPoly(regular(6, 0.49, Math.PI / 6)),
  /** Eight-pointed star of two squares (the girih star): radius of the union = max of the two. */
  star: (() => {
    const a = fromPoly(regular(4, 0.5, Math.PI / 4));
    const b = fromPoly(regular(4, 0.5, 0));
    return a.map((v, i) => Math.max(v, b[i]));
  })(),
  /** Pointed arch, a doorway: straight sides, a two-centred point on top (each side an arc centred across the axis). */
  arch: (() => {
    const w = 0.36;
    const spring = -0.12;
    const c = 0.3 * w;
    const R = w + c;
    const top = Math.acos(c / R);
    const side = (sgn: number, k: number) => [sgn * (-c + R * Math.cos(top * k)), spring - R * Math.sin(top * k)] as [number, number];
    const poly: Poly = [[-w, 0.5], [w, 0.5]];
    for (let i = 0; i <= 24; i++) poly.push(side(1, i / 24));
    for (let i = 23; i >= 0; i--) poly.push(side(-1, i / 24));
    return fromPoly(poly);
  })(),
} as const;

export type ShapeName = keyof typeof SHAPES;

/** Mix of two shapes, as a closed path of `size` px centred on (cx, cy). */
export function shapePath(a: ShapeName, b: ShapeName, t: number, size: number, cx: number, cy: number, rot = 0) {
  const ra = SHAPES[a];
  const rb = SHAPES[b];
  const pts = angles.map((ang, i) => {
    const r = (ra[i] + (rb[i] - ra[i]) * t) * size;
    return [cx + r * Math.cos(ang + rot), cy + r * Math.sin(ang + rot)];
  });
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";
}
