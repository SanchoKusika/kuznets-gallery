import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { parsePath, reduceInstructions } from "@remotion/paths";
import { logoParts } from "../../brand/logo-parts";
import { Canvas3D } from "../../effects/Canvas3D";
import { reels } from "../../data/selection";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, stroke } from "../../theme/tokens";
import { CANVAS_HANDOFF, CUSTOM, LOGO_GEOMETRY } from "../layout";

// R8 +0…+1.5b: the 3D canvas turns onto its edge, the edge becomes an ink line, the line swings, shrinks and
// bends into the logo's yellow wave. The morph is one filled ribbon (two edges of N points each); on its last
// frame the ribbon IS the wave's own outline (resampled in screen px), so LogoBuild's wave takes over unseen.

type Pt = { x: number; y: number };

/** Samples per ribbon edge: dense enough that the resampled outline matches the vector wave to < ¼ px. */
const N = 220;
/** Canvas3D defaults (its perspective and depth ratio): the edge strip is projected with the same numbers. */
const PERSPECTIVE = 3000;
const DEPTH = 0.04;

const WAVE = logoParts.find((p) => p.kind === "wave")!;

/** The wave's outline as a dense polyline in screen px. */
function outlinePoints(): Pt[] {
  const pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  let start = cur;
  const to = (x: number, y: number) => LOGO_GEOMETRY.toScreen(x, y);
  for (const i of reduceInstructions(parsePath(WAVE.d))) {
    if (i.type === "M") {
      cur = { x: i.x, y: i.y };
      start = cur;
      pts.push(to(cur.x, cur.y));
    } else if (i.type === "L") {
      cur = { x: i.x, y: i.y };
      pts.push(to(cur.x, cur.y));
    } else if (i.type === "C") {
      for (let k = 1; k <= 8; k++) {
        const u = k / 8;
        const v = 1 - u;
        const x = v * v * v * cur.x + 3 * v * v * u * i.cp1x + 3 * v * u * u * i.cp2x + u * u * u * i.x;
        const y = v * v * v * cur.y + 3 * v * v * u * i.cp1y + 3 * v * u * u * i.cp2y + u * u * u * i.y;
        pts.push(to(x, y));
      }
      cur = { x: i.x, y: i.y };
    } else {
      cur = start;
    }
  }
  return pts;
}

/** A polyline resampled to n points evenly by arc length. */
function resample(line: Pt[], n: number): Pt[] {
  const acc = [0];
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y));
  const total = acc[acc.length - 1];
  const out: Pt[] = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const s = (total * k) / (n - 1);
    while (j < line.length - 1 && acc[j] < s) j++;
    const u = (s - acc[j - 1]) / Math.max(1e-9, acc[j] - acc[j - 1]);
    out.push({ x: mix(line[j - 1].x, line[j].x, u), y: mix(line[j - 1].y, line[j].y, u) });
  }
  return out;
}

/**
 * The wave as a ribbon: its outline split at the leftmost and rightmost points into two edges, both running
 * left → right; the centre line and half-thickness vectors are derived from them.
 */
function waveRibbon() {
  const ring = outlinePoints();
  let iL = 0;
  let iR = 0;
  ring.forEach((p, i) => {
    if (p.x < ring[iL].x) iL = i;
    if (p.x > ring[iR].x) iR = i;
  });
  const walk = (from: number, until: number, dir: 1 | -1) => {
    const out: Pt[] = [];
    const n = ring.length;
    for (let i = from; ; i = (i + dir + n) % n) {
      out.push(ring[i]);
      if (i === until) break;
    }
    return out;
  };
  const a = resample(walk(iL, iR, 1), N);
  const b = resample(walk(iL, iR, -1), N);
  const mid = a.map((p, i) => ({ x: (p.x + b[i].x) / 2, y: (p.y + b[i].y) / 2 }));
  const half = a.map((p, i) => ({ x: (p.x - b[i].x) / 2, y: (p.y - b[i].y) / 2 }));
  const chord = Math.hypot(mid[N - 1].x - mid[0].x, mid[N - 1].y - mid[0].y);
  const centre = { x: (mid[0].x + mid[N - 1].x) / 2, y: (mid[0].y + mid[N - 1].y) / 2 };
  return { a, b, mid, half, chord, centre };
}

/**
 * Screen box of the turned canvas — Canvas3D's pose (box pushed back by half its depth, turned about Y) and
 * projection (eye `PERSPECTIVE` px in front, vanishing point on the canvas centre). rotX is ignored: it is
 * already ~0 by the time the box is used (the last frames of the turn).
 */
function silhouette(rotYDeg: number, depthRatio: number) {
  const s = CANVAS_HANDOFF.scale;
  const a = (rotYDeg * Math.PI) / 180;
  const d = CUSTOM.w * depthRatio;
  let x0 = Infinity;
  let x1 = -Infinity;
  let h = 0;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const x = (sx * CUSTOM.w) / 2;
      const z = (sz * d) / 2;
      const xr = s * (x * Math.cos(a) + z * Math.sin(a));
      const zr = s * (-x * Math.sin(a) + z * Math.cos(a)) - (s * d) / 2;
      const k = PERSPECTIVE / (PERSPECTIVE - zr);
      x0 = Math.min(x0, xr * k);
      x1 = Math.max(x1, xr * k);
      h = Math.max(h, s * CUSTOM.h * k);
    }
  return { x: CANVAS_HANDOFF.x + (x0 + x1) / 2, y: CANVAS_HANDOFF.y, w: x1 - x0, h };
}

/** Depth ratio at which the edge-on canvas is exactly one pencil line wide (the side then IS the line). */
const LINE_DEPTH = (() => {
  const k = PERSPECTIVE / (PERSPECTIVE - (CANVAS_HANDOFF.scale * CUSTOM.w) / 2);
  return stroke.reels / (k * CANVAS_HANDOFF.scale * CUSTOM.w);
})();

/** Frames (relative to R8) of the morph; the wave is complete exactly at `done` (= LogoBuild's wave.from). */
export function edgeToWaveTiming(t: ReturnType<typeof useTiming>) {
  return {
    /** The canvas turns onto its edge (½b). */
    turn: { from: 0, duration: t.e(1) },
    /** Over the second half of the turn the box flattens, so edge-on it is a line, not a strip. */
    flatten: { from: t.s(1), duration: t.s(1) },
    /** The edge darkens to ink just before it is fully edge-on. */
    ink: { from: t.e(1) - t.s(0.5), duration: t.s(0.5) },
    /** Swing, travel and shrink: vertical line → horizontal chord of the wave (1b). */
    swing: { from: t.e(1), duration: t.b(1) },
    /** The line bends into the wave and takes its colour and thickness. */
    bend: { from: t.e(1) + t.s(1), duration: t.b(1) - t.s(1) },
    done: t.b(1.5),
  };
}

export function R8EdgeToWave() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = useTiming();
  const tm = edgeToWaveTiming(t);
  const wave = useMemo(waveRibbon, []);
  const edge = useMemo(() => silhouette(-90, LINE_DEPTH), []);
  if (frame >= tm.done) return null;

  const turnP = progress(frame, tm.turn.from, tm.turn.duration, ease.inOut);
  const turned = frame >= tm.turn.from + tm.turn.duration;
  const rotY = mix(CANVAS_HANDOFF.rotY, -90, turnP);
  const depth = mix(DEPTH, LINE_DEPTH, progress(frame, tm.flatten.from, tm.flatten.duration, ease.inOut));
  const inkP = progress(frame, tm.ink.from, tm.ink.duration, ease.linear);
  const swingP = progress(frame, tm.swing.from, tm.swing.duration, ease.inOut);
  const bendP = progress(frame, tm.bend.from, tm.bend.duration, ease.inOut);

  // Straight line: centre, direction angle (90° = pointing down, 0° = pointing right), length, half-width.
  // Until edge-on it covers the canvas's silhouette; then it swings counter-clockwise (the top end becomes the
  // wave's left end) while its centre travels on a slight arc and it shrinks to the wave's chord.
  const start = turned ? edge : silhouette(rotY, depth);
  const phi = (Math.PI / 2) * (1 - swingP);
  const arc = Math.sin(Math.PI * swingP) * 60;
  const c = { x: mix(start.x, wave.centre.x, swingP) - arc * 0.4, y: mix(start.y, wave.centre.y, swingP) - arc };
  const len = mix(start.h, wave.chord, swingP);
  const hw = Math.max(stroke.reels, start.w) / 2;
  const dir = { x: Math.cos(phi), y: Math.sin(phi) };
  // Normal pointing to the ribbon's `a` edge: at the end (phi = 0) it must match the wave's own half vectors' side.
  const sideA = wave.half[Math.floor(N / 2)].y < 0 ? -1 : 1;
  const nrm = { x: -dir.y * sideA, y: dir.x * sideA };

  const centreLine: Pt[] = [];
  const edgeA: string[] = [];
  const edgeB: string[] = [];
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1) - 0.5;
    const straight = { x: c.x + dir.x * s * len, y: c.y + dir.y * s * len };
    const m = { x: mix(straight.x, wave.mid[i].x, bendP), y: mix(straight.y, wave.mid[i].y, bendP) };
    centreLine.push(m);
    const h = { x: mix(nrm.x * hw, wave.half[i].x, bendP), y: mix(nrm.y * hw, wave.half[i].y, bendP) };
    edgeA.push(`${(m.x + h.x).toFixed(2)} ${(m.y + h.y).toFixed(2)}`);
    edgeB.push(`${(m.x - h.x).toFixed(2)} ${(m.y - h.y).toFixed(2)}`);
  }
  const ribbon = `M${edgeA.join("L")}L${edgeB.reverse().join("L")}Z`;
  const pencil = `M${centreLine.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("L")}`;
  // Colour comes as a yellow ribbon swelling around the ink line, then the ink fades out of it — an RGB blend
  // of ink and yellow would pass through olive.
  const yellowOp = progress(bendP, 0.2, 0.45, ease.linear);
  const pencilOp = 1 - progress(bendP, 0.55, 0.45, ease.linear);

  return (
    <>
      {!turned ? (
        <Canvas3D
          code={reels.custom}
          faceWidth={CUSTOM.w}
          faceHeight={CUSTOM.h}
          x={CANVAS_HANDOFF.x}
          y={CANVAS_HANDOFF.y}
          scale={CANVAS_HANDOFF.scale}
          rotY={rotY}
          rotX={mix(CANVAS_HANDOFF.rotX, 0, turnP)}
          shadow={1 - turnP}
          perspective={PERSPECTIVE}
          depth={depth}
        />
      ) : null}
      {inkP > 0 ? (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: inkP }}>
          {/* Until edge-on the ink covers the narrowing silhouette; after that it is a pencil line of stroke.reels. */}
          {!turned ? <path d={ribbon} fill={color.ink} /> : null}
          {turned && yellowOp > 0 ? <path d={ribbon} fill={color.logoWave} opacity={yellowOp} /> : null}
          {turned && pencilOp > 0 ? (
            <path d={pencil} fill="none" stroke={color.ink} strokeWidth={stroke.reels} strokeLinecap="round" strokeLinejoin="round" opacity={pencilOp} />
          ) : null}
        </svg>
      ) : null}
    </>
  );
}
