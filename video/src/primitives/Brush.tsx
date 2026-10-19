import type { CSSProperties } from "react";
import { random } from "remotion";

// Paint applied over pictures and type in the short reels: a brush stroke is a few bristle bands along one smooth
// centre line, each with ragged edges and its own length, so the stroke reads as paint (streaky, drying out at the
// end) rather than as a vector line. Everything is a pure function of the progress and a seed.

export type Pt = [number, number];

/** Centripetal Catmull–Rom through the control points, sampled evenly by arc length. */
export function smoothLine(ctrl: Pt[], samples = 160): Pt[] {
  if (ctrl.length < 2) return ctrl;
  const pts = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  const dense: Pt[] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    for (let k = 0; k < 24; k++) {
      const t = k / 24;
      const t2 = t * t;
      const t3 = t2 * t;
      dense.push([0, 1].map(
        (j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3),
      ) as Pt);
    }
  }
  dense.push(ctrl[ctrl.length - 1]);
  return resample(dense, samples);
}

/** Even arc-length resampling of a polyline. */
export function resample(line: Pt[], n: number): Pt[] {
  const acc = [0];
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const total = acc[acc.length - 1] || 1;
  const out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const d = (total * k) / (n - 1);
    while (j < acc.length - 2 && acc[j + 1] < d) j++;
    const seg = acc[j + 1] - acc[j] || 1;
    const u = (d - acc[j]) / seg;
    out.push([line[j][0] + (line[j + 1][0] - line[j][0]) * u, line[j][1] + (line[j + 1][1] - line[j][1]) * u]);
  }
  return out;
}

/** Smooth value noise in 0…1 along the stroke (deterministic per seed). */
const vnoise = (seed: string, x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return random(`${seed}-${i}`) * (1 - u) + random(`${seed}-${i + 1}`) * u;
};

type BandOpts = { width: number; offset: number; end: number; seed: string; rough: number };

/** Outline of one bristle band for the drawn share `p` of the line. */
function band(line: Pt[], p: number, { width, offset, end, seed, rough }: BandOpts): string {
  const n = line.length;
  const upto = Math.min(p, end) * (n - 1);
  if (upto <= 0.5) return "";
  const last = Math.floor(upto);
  const pts: Pt[] = line.slice(0, last + 1);
  const frac = upto - last;
  if (frac > 0 && last + 1 < n) pts.push([line[last][0] + (line[last + 1][0] - line[last][0]) * frac, line[last][1] + (line[last + 1][1] - line[last][1]) * frac]);
  const m = pts.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < m; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(m - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const nx = -ty;
    const ny = tx;
    const u = i / (n - 1);
    // Full width after a short start; the head of a stroke still being drawn is slightly narrower (the brush lifts).
    const startTaper = Math.min(1, u / 0.05) ** 0.6;
    const head = (m - 1 - i) / (n - 1);
    const headTaper = p >= end ? Math.min(1, head / 0.06) ** 0.5 : Math.min(1, 0.55 + head / 0.05);
    const body = 0.82 + 0.36 * vnoise(`${seed}-w`, u * 6);
    const w = (width / 2) * startTaper * headTaper * body;
    const eL = 1 + rough * (vnoise(`${seed}-l`, i * 0.9) - 0.5) + rough * 0.6 * (random(`${seed}-L${i}`) - 0.5);
    const eR = 1 + rough * (vnoise(`${seed}-r`, i * 0.9) - 0.5) + rough * 0.6 * (random(`${seed}-R${i}`) - 0.5);
    const cx = pts[i][0] + nx * offset;
    const cy = pts[i][1] + ny * offset;
    left.push([cx + nx * w * eL, cy + ny * w * eL]);
    right.push([cx - nx * w * eR, cy - ny * w * eR]);
  }
  const ring = [...left, ...right.reverse()];
  return "M" + ring.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";
}

export type BrushOpts = {
  /** Stroke width, px. */
  width: number;
  seed?: string;
  /** Edge raggedness, 0…1. */
  rough?: number;
  /** Bristle bands across the width. */
  bands?: number;
  /** How much the outer bands dry out before the end (share of the length). */
  dry?: number;
};

/** Paths of a brush stroke along `line` (from `smoothLine`), drawn up to `p` (0…1). */
export function brushPaths(line: Pt[], p: number, { width, seed = "brush", rough = 0.35, bands = 5, dry = 0.12 }: BrushOpts): string[] {
  if (p <= 0) return [];
  const out: string[] = [];
  for (let k = 0; k < bands; k++) {
    const across = bands === 1 ? 0 : k / (bands - 1) - 0.5;
    const outer = Math.abs(across) * 2;
    const end = 1 - dry * outer * (0.4 + 0.6 * random(`${seed}-end${k}`));
    const d = band(line, p, {
      width: width * (bands === 1 ? 1 : 0.42 - 0.12 * outer),
      offset: across * width * 0.62,
      end,
      seed: `${seed}-${k}`,
      rough: rough * (0.6 + 0.8 * outer),
    });
    if (d) out.push(d);
  }
  return out;
}

type BrushProps = BrushOpts & {
  /** Control points of the centre line (screen px of the enclosing svg). */
  points: Pt[];
  progress: number;
  color: string;
  opacity?: number;
  style?: CSSProperties;
};

/** One brush stroke inside the caller's `<svg>`. */
export function BrushStroke({ points, progress, color, opacity = 1, style, ...opts }: BrushProps) {
  const line = smoothLine(points, 140);
  return (
    <g fill={color} opacity={opacity} style={style}>
      {brushPaths(line, progress, opts).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/** Splash of paint: a blob with a few drops thrown along `angle`, popping in with `p` (0…1). */
export function Splat({ x, y, r, p, color, seed = "splat", angle = -0.6 }: { x: number; y: number; r: number; p: number; color: string; seed?: string; angle?: number }) {
  if (p <= 0) return null;
  const k = Math.min(1, p * 1.15);
  const blob: Pt[] = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const rr = r * (0.82 + 0.3 * vnoise(`${seed}-b`, i * 0.7)) * k;
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  });
  const d = "M" + blob.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join("L") + "Z";
  return (
    <g fill={color}>
      <path d={d} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = angle + (random(`${seed}-a${i}`) - 0.5) * 1.6;
        const dist = r * (1.35 + 1.4 * random(`${seed}-d${i}`)) * Math.min(1, p * 1.4);
        const rr = r * (0.08 + 0.16 * random(`${seed}-r${i}`)) * k;
        return <circle key={i} cx={x + Math.cos(a) * dist} cy={y + Math.sin(a) * dist} r={rr} />;
      })}
    </g>
  );
}
