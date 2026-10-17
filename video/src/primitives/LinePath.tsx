import { evolvePath, getLength, getPointAtLength, getSubpaths } from "@remotion/paths";
import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { LineArt } from "../lines/types";
import { color as tokens } from "../theme/tokens";

/**
 * Pencil pace: monotonic 0→1 with ±30% speed wobble, so a line is not drawn at machine speed.
 * Compose with an easing: `pencil(progress(frame, from, dur, ease.out))`.
 */
export const pencil = (t: number, wobble = 0.3, waves = 3) => {
  const k = 2 * Math.PI * waves;
  return Math.max(0, Math.min(1, t + (wobble * Math.sin(k * t)) / k));
};

/** Sine "thread" from a screen edge to a point (logo wave as the line that draws everything). */
export function threadPath(from: { x: number; y: number }, to: { x: number; y: number }, amplitude = 26, periods = 1.5) {
  const n = 48;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // Envelope: full wave at the edge, flat where it meets the drawing.
    const env = Math.sin(Math.PI * Math.min(1, t * 1.25)) * (1 - t);
    const x = from.x + dx * t;
    const y = from.y + dy * t + Math.sin(2 * Math.PI * periods * t) * amplitude * env;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

type Stroke = { color?: string; width?: number; opacity?: number };

const pathStyle = ({ color = tokens.ink, width = 3, opacity = 1 }: Stroke): CSSProperties => ({
  fill: "none",
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  opacity,
});

type DrawingProps = Stroke & {
  art: LineArt;
  /** 0 → nothing, 1 → whole drawing (parts drawn in order, by length). */
  progress: number;
  /** Screen position of the box's top-left. */
  x: number;
  y: number;
  /**
   * Thread entering from a screen edge to the first point of the first part; drawn first.
   * `left` / `right`: horizontal edge at the start point's height (± `threadDy`).
   */
  thread?: { from: "left" | "right"; frameWidth: number; amplitude?: number; periods?: number; dy?: number };
  style?: CSSProperties;
};

/** A line drawing drawn on screen like a pencil (brief 5.3). */
export function LineDrawing({ art, progress, x, y, thread, style, ...stroke }: DrawingProps) {
  const paths = useMemo(() => {
    const list = [...art.parts];
    if (thread) {
      const p0 = getPointAtLength(art.parts[0], 0) ?? { x: 0, y: 0 };
      const edgeX = thread.from === "left" ? -x - 20 : thread.frameWidth - x + 20;
      list.unshift(threadPath({ x: edgeX, y: p0.y + (thread.dy ?? 0) }, p0, thread.amplitude, thread.periods));
    }
    const lens = list.map((d) => getLength(d));
    return { list, lens, total: lens.reduce((a, b) => a + b, 0) };
  }, [art, thread, x]);

  let start = 0;
  return (
    <svg
      width={art.w}
      height={art.h}
      viewBox={`0 0 ${art.w} ${art.h}`}
      style={{ position: "absolute", left: x, top: y, overflow: "visible", ...style }}
    >
      {paths.list.map((d, i) => {
        const len = paths.lens[i];
        const p = Math.max(0, Math.min(1, (progress * paths.total - start) / len));
        start += len;
        // A zero-length dash with round caps would leave a dot.
        if (p <= 0) return null;
        const evo = p >= 1 ? null : evolvePath(p, d);
        return <path key={i} d={d} style={{ ...pathStyle(stroke), ...(evo ?? {}) }} />;
      })}
    </svg>
  );
}

type Pt = { x: number; y: number };

const SAMPLES = 96;

/** Subpath → evenly spaced points (open shapes keep their ends, closed ones close). */
function resample(d: string, n = SAMPLES): Pt[] {
  const len = getLength(d);
  // Clamp: (len·i)/(n−1) can overshoot len by a rounding error, and getPointAtLength then returns null.
  return Array.from({ length: n }, (_, i) => getPointAtLength(d, Math.min(len, (len * i) / (n - 1))) ?? getPointAtLength(d, len * 0.9999) ?? { x: 0, y: 0 });
}

const centroid = (pts: Pt[]): Pt => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});

/** Sample both parts once; subpaths pair by index, a missing one shrinks to the other's centre. */
function morphPlan(a: string, b: string) {
  const sa = getSubpaths(a).map((d) => resample(d));
  const sb = getSubpaths(b).map((d) => resample(d));
  const n = Math.max(sa.length, sb.length);
  return Array.from({ length: n }, (_, i) => {
    const pa = sa[i] ?? Array(SAMPLES).fill(centroid(sb[i]));
    const pb = sb[i] ?? Array(SAMPLES).fill(centroid(sa[i]));
    return [pa, pb] as const;
  });
}

const morphD = (plan: ReturnType<typeof morphPlan>, t: number) =>
  plan
    .map(([pa, pb]) =>
      pa.map((p, i) => `${i ? "L" : "M"}${(p.x + (pb[i].x - p.x) * t).toFixed(1)} ${(p.y + (pb[i].y - p.y) * t).toFixed(1)}`).join(""),
    )
    .join("");

type MorphProps = Stroke & {
  from: LineArt;
  to: LineArt;
  /** 0 → `from`, 1 → `to` (ease it with ease.inOut). */
  t: number;
  x: number;
  y: number;
  style?: CSSProperties;
};

/**
 * Pairwise morph of two drawings with the same number of parts (brief 6.4). Parts are resampled
 * to points and blended, so the shapes need not share path commands; at t = 0 and 1 the original
 * paths are shown.
 */
export function MorphLines({ from, to, t, x, y, style, ...stroke }: MorphProps) {
  if (from.parts.length !== to.parts.length) throw new Error(`MorphLines: ${from.parts.length} vs ${to.parts.length} parts`);
  const plans = useMemo(() => from.parts.map((d, i) => morphPlan(d, to.parts[i])), [from, to]);
  const w = Math.max(from.w, to.w);
  const h = Math.max(from.h, to.h);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: x, top: y, overflow: "visible", ...style }}>
      {from.parts.map((d, i) => (
        <path key={i} d={t <= 0 ? d : t >= 1 ? to.parts[i] : morphD(plans[i], t)} style={pathStyle(stroke)} />
      ))}
    </svg>
  );
}

/** One static or evolving path in absolute screen coordinates (wires, rules, crop marks…). */
export function LinePath({ d, progress = 1, style, ...stroke }: Stroke & { d: string; progress?: number; style?: CSSProperties }) {
  if (progress <= 0) return null;
  const evo = progress >= 1 ? null : evolvePath(progress, d);
  return <path d={d} style={{ ...pathStyle(stroke), ...(evo ?? {}), ...style }} />;
}
