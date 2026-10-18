// R1–R3 shared state: the canvases on the nail from the drop in R1 to the last interior of R3 (brief 7).
// Pure functions of the act frame (the wire simulation is precomputed once per fps), so the scenes agree on
// every position.
//
// Model, in screen px with z towards the viewer (CSS 3D): a canvas hangs from its apex — the point over its top
// centre that sits on the nail — turned about the vertical axis through the apex (rotY, the R3 spin) and then
// about the apex in the wall plane (rotZ, the pendulum). Its z = 0 plane is the middle of its depth, where the
// wire's rings are; the face is DEPTH / 2 in front. The wire is a chain of points simulated with gravity, tied to
// the rings and wrapped over the nail's shank; it is drawn behind the canvas, so only the Λ above it shows.

import { reels } from "../../data/selection";
import { PENDULUM } from "../../effects/Pendulum";
import { NAIL_SHANK, wireRings } from "../../primitives/PictureWire";
import { ease, mix, progress } from "../../theme/easing";
import type { Timing } from "../../theme/timing";
import { FRAME_TOP, NAIL } from "../layout";

export type Size = { w: number; h: number };
export type Rect = Size & { x: number; y: number };
type P3 = { x: number; y: number; z: number };

/** Frame hanging on the nail: centred under it, top edge at `top`. */
export const hungRect = (s: Size, top: number = FRAME_TOP): Rect => ({ x: NAIL.x - s.w / 2, y: top, w: s.w, h: s.h });

/** The extreme the drop ends in and the pendulum is released from (brief R2, 6.3). */
export const SWING_FROM = -16;

/** The square of R1–R2 is the home frame of R3: «Путь домой» rises in it without a resize. */
export const SQUARE = reels.interiors[0].frame;

/** Wire apex above the frame's top edge: the nail when it hangs. */
export const APEX = FRAME_TOP - NAIL.y;

/** Canvas depth (the stretcher), px. */
export const DEPTH = 22;

/** CSS perspective of the act, px; its origin is the nail, so a spin on the nail is symmetric. */
export const PERSPECTIVE = 2400;

/** Key moments of the act, frames relative to its start (R1 +0). */
export function actTimes(t: Timing) {
  const r2 = t.bar(1);
  const r3 = t.bar(2);
  return {
    r2,
    r3,
    r4: t.bar(4),
    /** The dot reaches the nail. */
    dotArrive: t.b(1.5),
    /** Dot → nail head (28 → 18 px) and its shadow. */
    nail: { from: t.b(1.5), duration: t.e(1) },
    hook: { from: t.s(1), duration: t.b(1.5), exit: r2, exitDuration: t.e(1) },
    /** The canvas falls from above the screen; its wire catches on the nail. */
    drop: { from: t.b(3.25), duration: r2 - t.b(3.25) },
    /** R3 changes: kids, office, cafe. */
    changes: [1, 2, 3].map((k) => r3 + t.b(2 * k)),
    /** The spin of a change in R3 (and the morph of the interior, the labels). */
    change: t.b(1),
    /** A new work / chip in R2. */
    swap: t.e(1),
  };
}

export type Hung = { code: string; at: number; rise: number };

/** Works rising in the square canvas, one per beat of R2 (the fifth, «Путь домой», opens R3). */
export function hangSchedule(t: Timing): Hung[] {
  const T = actTimes(t);
  return reels.tryOn.map((code, i) => ({ code, at: i === 0 ? 0 : T.r2 + t.b(i), rise: i === 0 ? 0 : T.swap }));
}

/** Frame top before the drop: just off the top of the screen. */
export const dropStartTop = (h: number) => -h - 40;

/**
 * The drop (R1 +3.25b → R2 +0): the canvas falls from above the screen (y ∝ t²), the wire catches it a little below
 * its hanging height (it stretches) and pulls it back. It swings out from the first frame of the fall as a pendulum
 * does from rest, −16°·sin(π/2·u), so it arrives at the extreme with zero angular velocity — the state the pendulum
 * is released from.
 */
export function dropAt(frame: number, t: Timing, h: number) {
  const { from, duration } = actTimes(t).drop;
  const fall = 0.6;
  const stretch = 18;
  const u = Math.max(0, Math.min(1, (frame - from) / duration));
  const angle = SWING_FROM * Math.sin((Math.PI / 2) * u);
  if (u <= fall) {
    const q = u / fall;
    return { top: mix(dropStartTop(h), FRAME_TOP + stretch, q * q), angle };
  }
  // Back up and a small second bounce, both decaying.
  const v = (u - fall) / (1 - fall);
  return { top: FRAME_TOP + stretch * Math.cos((Math.PI * 3 * v) / 2) * (1 - v) ** 1.5, angle };
}

/** Spin of a change: 0 → 1 over the change (in-out); the old canvas turns 0 → 90°, the new one −90° → 0. */
const spinP = (frame: number, at: number, t: Timing) => progress(frame, at, actTimes(t).change, ease.inOut);

/** One canvas on the nail: its size, content and the frames it is on screen (act frames). */
export type CanvasSlot = { index: number; size: Size; code: string | null; from: number; to: number };

/** Index 0: the square of R1–R3 (works rise in it); 1–3: the interiors' canvases, each spun in on its change. */
export function canvasSlots(t: Timing): CanvasSlot[] {
  const T = actTimes(t);
  // The swap: the first frame the spin is past edge-on (the in-out curve is not symmetric, so it is searched).
  const mid = (k: number) => {
    let f = T.changes[k];
    while (spinP(f, T.changes[k], t) < 0.5) f++;
    return f;
  };
  const end = T.r4 + t.s(1);
  return reels.interiors.map((r, i) => ({
    index: i,
    size: i === 0 ? SQUARE : r.frame,
    code: i === 0 ? null : r.code,
    from: i === 0 ? T.drop.from : mid(i - 1),
    to: i < reels.interiors.length - 1 ? mid(i) : end,
  }));
}

/** The canvas's pose at an act frame. */
export function poseAt(slot: CanvasSlot, frame: number, t: Timing) {
  const T = actTimes(t);
  const drop = frame < T.r2 ? dropAt(frame, t, slot.size.h) : null;
  const top = drop ? drop.top : FRAME_TOP;
  const rotZ = drop ? drop.angle : swingAt(frame, t);
  let rotY = 0;
  if (slot.index > 0) rotY = 180 * spinP(frame, T.changes[slot.index - 1], t) - 180;
  if (slot.index < T.changes.length) rotY += 180 * spinP(frame, T.changes[slot.index], t);
  return { top, rotZ, rotY };
}

/* ── Pendulum ─────────────────────────────────────────────────────────────────────────────────────────────────── */

const HZ = PENDULUM.stepHz;

/**
 * Swing angle (deg) after the drop: the site's pendulum released at R2 +0 from −16°, and on every R3 change, as the
 * new canvas comes round, a small push (alternating sides) — it settles again over the pause.
 */
function swingSteps(t: Timing) {
  const T = actTimes(t);
  const toStep = (frame: number) => Math.round(((frame - T.r2) / t.fps) * HZ);
  const kicks = new Map(T.changes.map((at, k) => [toStep(at + Math.round(T.change * 0.6)), (k % 2 ? -1 : 1) * 0.3]));
  const n = toStep(T.r4 + t.b(1));
  const out = new Float64Array(n + 1);
  let a = SWING_FROM;
  let v = 0;
  out[0] = a;
  for (let i = 1; i <= n; i++) {
    v += (0 - a) * PENDULUM.k;
    v *= PENDULUM.d;
    v += kicks.get(i) ?? 0;
    a += v;
    out[i] = a;
  }
  return out;
}

const swingCache = new Map<number, Float64Array>();

export function swingAt(frame: number, t: Timing) {
  const T = actTimes(t);
  if (!swingCache.has(t.fps)) swingCache.set(t.fps, swingSteps(t));
  const steps = swingCache.get(t.fps)!;
  const s = ((frame - T.r2) / t.fps) * HZ;
  if (s <= 0) return SWING_FROM;
  const i = Math.floor(s);
  if (i >= steps.length - 1) return steps[steps.length - 1];
  return steps[i] + (steps[i + 1] - steps[i]) * (s - i);
}

/* ── Geometry ─────────────────────────────────────────────────────────────────────────────────────────────────── */

/** A point of the canvas (relative to its apex, z from its mid-depth) placed by the pose. */
export function placeOnCanvas(p: P3, pose: { top: number; rotZ: number; rotY: number }): P3 {
  const b = (pose.rotY * Math.PI) / 180;
  const a = (pose.rotZ * Math.PI) / 180;
  const x1 = p.x * Math.cos(b) + p.z * Math.sin(b);
  const z1 = -p.x * Math.sin(b) + p.z * Math.cos(b);
  return {
    x: NAIL.x + x1 * Math.cos(a) - p.y * Math.sin(a),
    y: pose.top - APEX + x1 * Math.sin(a) + p.y * Math.cos(a),
    z: z1,
  };
}

/** Perspective projection of the act (origin on the nail). */
export function project(p: P3) {
  const k = PERSPECTIVE / (PERSPECTIVE - p.z);
  return { x: NAIL.x + (p.x - NAIL.x) * k, y: NAIL.y + (p.y - NAIL.y) * k };
}

const ringsAt = (size: Size, pose: { top: number; rotZ: number; rotY: number }) => {
  const { dx, dy } = wireRings(size.w, size.h);
  return [placeOnCanvas({ x: -dx, y: APEX + dy, z: 0 }, pose), placeOnCanvas({ x: dx, y: APEX + dy, z: 0 }, pose)];
};

/* ── Wire ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

/** Points per half of the wire, simulation rate, gravity (px/s²), constraint passes, damping per step. */
const WIRE_SIM = { n: 18, hz: 240, gravity: 9000, passes: 30, damping: 0.993, slack: 1.004 };

/**
 * The wire of one canvas, every 1/240 s from the moment it is hooked on the nail: two Verlet chains under gravity,
 * each from the nail (pinned — the canvas turns about it, so the wire does not slide) to a ring, which the pose
 * moves. Fixed segment lengths: a slack wire folds and sags, a jerk runs along it as a wave, and when the canvas
 * pulls harder than the wire can give (the catch of the drop) it stretches a little.
 *
 * The square is hooked as it falls past the nail: until then its wire hangs between the rings behind the canvas,
 * unseen, and it is hooked slack, moving with the canvas. A spun-in canvas is hooked taut (edge-on, the wire a
 * vertical line). Returned as positions per step, flat [step][half][point][xyz].
 */
function simulateWire(slot: CanvasSlot, t: Timing) {
  const { n, hz, gravity, passes, damping, slack } = WIRE_SIM;
  const { dx, dy } = wireRings(slot.size.w, slot.size.h);
  const seg = (Math.hypot(dx, APEX + dy) * slack) / (n - 1);
  const dt = 1 / hz;
  const from = hookFrame(slot, t);
  const frameAt = (step: number) => from + (step / hz) * t.fps;
  const steps = Math.ceil(((slot.to - from) / t.fps) * hz) + 1;
  const nail: P3 = { x: NAIL.x, y: NAIL.y, z: 0 };

  const rings = ringsAt(slot.size, poseAt(slot, from, t));
  const before = ringsAt(slot.size, poseAt(slot, from - t.fps / hz, t));
  const halves = rings.map((ring, side) => {
    const pts: P3[] = [];
    const prev: P3[] = [];
    // Hooked slack, the points bunched on the chord (gravity and the constraints unfold them), moving as the ring.
    const v = { x: ring.x - before[side].x, y: ring.y - before[side].y, z: ring.z - before[side].z };
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const p = { x: mix(nail.x, ring.x, u), y: mix(nail.y, ring.y, u), z: mix(nail.z, ring.z, u) };
      pts.push(p);
      prev.push({ x: p.x - v.x * u, y: p.y - v.y * u, z: p.z - v.z * u });
    }
    return { pts, prev };
  });

  const step = (ends: P3[]) => {
    halves.forEach(({ pts, prev }, side) => {
      for (let i = 1; i < n - 1; i++) {
        const p = pts[i];
        const q = prev[i];
        const vx = (p.x - q.x) * damping;
        const vy = (p.y - q.y) * damping;
        const vz = (p.z - q.z) * damping;
        q.x = p.x;
        q.y = p.y;
        q.z = p.z;
        p.x += vx;
        p.y += vy + gravity * dt * dt;
        p.z += vz;
      }
      for (let k = 0; k < passes; k++) {
        Object.assign(pts[0], nail);
        Object.assign(pts[n - 1], ends[side]);
        for (let i = 0; i < n - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const ex = b.x - a.x;
          const ey = b.y - a.y;
          const ez = b.z - a.z;
          const d = Math.hypot(ex, ey, ez) || 1e-6;
          const diff = (d - seg) / d;
          // The nail and the ring do not give: the inner point takes the whole correction.
          const wa = i === 0 ? 0 : i + 1 === n - 1 ? 1 : 0.5;
          const wb = 1 - wa;
          a.x += ex * diff * wa;
          a.y += ey * diff * wa;
          a.z += ez * diff * wa;
          b.x -= ex * diff * wb;
          b.y -= ey * diff * wb;
          b.z -= ez * diff * wb;
        }
      }
      Object.assign(pts[0], nail);
      Object.assign(pts[n - 1], ends[side]);
    });
  };

  const out = new Float32Array(steps * 2 * n * 3);
  for (let s = 0; s < steps; s++) {
    if (s > 0) step(ringsAt(slot.size, poseAt(slot, frameAt(s), t)));
    halves.forEach(({ pts }, side) => pts.forEach((p, i) => out.set([p.x, p.y, p.z], ((s * 2 + side) * n + i) * 3)));
  }
  return out;
}

/** When the canvas's wire is on the nail: the square's as its top edge falls past the nail, a spun-in one at once. */
function hookFrame(slot: CanvasSlot, t: Timing) {
  if (slot.index > 0) return slot.from;
  let f = slot.from;
  while (poseAt(slot, f, t).top < NAIL.y + NAIL_SHANK) f += 0.25;
  return f;
}

const wireCache = new Map<string, Float32Array>();

/**
 * The wire of a canvas at an act frame, projected to the screen: ring → nail → ring, or null before it is hooked
 * (the square's wire is behind the canvas then).
 */
export function wireAt(slot: CanvasSlot, frame: number, t: Timing) {
  const key = `${t.fps}:${slot.index}`;
  if (!wireCache.has(key)) wireCache.set(key, simulateWire(slot, t));
  const data = wireCache.get(key)!;
  const from = hookFrame(slot, t);
  if (frame < from) return null;
  const { n, hz } = WIRE_SIM;
  const steps = data.length / (2 * n * 3);
  const s = Math.max(0, Math.min(steps - 1, ((frame - from) / t.fps) * hz));
  const i = Math.min(steps - 2, Math.floor(s));
  const u = s - i;
  const point = (side: number, k: number) => {
    const a = ((i * 2 + side) * n + k) * 3;
    const b = (((i + 1) * 2 + side) * n + k) * 3;
    return project({ x: mix(data[a], data[b], u), y: mix(data[a + 1], data[b + 1], u), z: mix(data[a + 2], data[b + 2], u) });
  };
  const left = Array.from({ length: n }, (_, k) => point(0, n - 1 - k));
  const right = Array.from({ length: n - 1 }, (_, k) => point(1, k + 1));
  return [...left, ...right];
}
