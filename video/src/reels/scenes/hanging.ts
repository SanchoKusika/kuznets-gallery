// R1–R3 shared state: one canvas on the nail from the drop in R1 to the last interior of R3 (brief 7).
// Pure functions of the act frame, so the scenes and the cover agree on every position.

import { reels } from "../../data/selection";
import { ease, mix, progress } from "../../theme/easing";
import type { Timing } from "../../theme/timing";
import { FRAME_TOP, NAIL } from "../layout";

export type Size = { w: number; h: number };
export type Rect = Size & { x: number; y: number };

/** Frame hanging on the nail: centred under it, top edge at `top`. */
export const hungRect = (s: Size, top: number = FRAME_TOP): Rect => ({ x: NAIL.x - s.w / 2, y: top, w: s.w, h: s.h });

/** The extreme the drop ends in and the pendulum is released from (brief R2, 6.3). */
export const SWING_FROM = -16;

/** The square of R1–R2 is the home frame of R3: «Путь домой» swings in without a resize. */
export const SQUARE = reels.interiors[0].frame;

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
    /** Dot → nail head (28 → 18 px) and the shadow stroke. */
    nail: { from: t.b(1.5), duration: t.e(1) },
    hook: { from: t.s(1), duration: t.b(1.5), exit: r2, exitDuration: t.e(1) },
    wire: { from: t.b(3), duration: t.e(1) },
    drop: { from: t.b(3.5), duration: r2 - t.b(3.5) },
    /** R3 changes: kids, office, cafe. */
    changes: [1, 2, 3].map((k) => r3 + t.b(2 * k)),
    /** Morph, resize and the new work's rise in R3. */
    change: t.b(1),
    /** A new work / chip in R2. */
    swap: t.e(1),
  };
}

export type Hung = { code: string; at: number; rise: number; size: Size };

/** Works in the frame in order: one per beat of R2 (the fifth opens R3), then one per R3 interior. */
export function hangSchedule(t: Timing): Hung[] {
  const T = actTimes(t);
  const tryOn = reels.tryOn.map((code, i) => ({ code, at: i === 0 ? 0 : T.r2 + t.b(i), rise: i === 0 ? 0 : T.swap, size: SQUARE }));
  const rooms = reels.interiors.slice(1).map((r, k) => ({ code: r.code, at: T.changes[k], rise: T.change, size: r.frame }));
  return [...tryOn, ...rooms];
}

/** Frame size at a frame: square until R3, then each change resizes it over 1b (in-out). */
export function frameSizeAt(frame: number, t: Timing): Size {
  const T = actTimes(t);
  let s: Size = SQUARE;
  T.changes.forEach((at, k) => {
    const p = progress(frame, at, T.change, ease.inOut);
    if (p <= 0) return;
    const next = reels.interiors[k + 1].frame;
    s = { w: mix(s.w, next.w, p), h: mix(s.h, next.h, p) };
  });
  return s;
}

/** Frame top before the drop: just off the top of the screen (the wire is drawn down from its corners). */
export const dropStartTop = (h: number) => -h - 40;

/** Wire apex above the frame's top edge: the nail when it hangs. */
const APEX = FRAME_TOP - NAIL.y;

/**
 * The drop (R1 +3.5b → R2 +0, a quarter of the swing's period): the canvas falls from above the screen (y ∝ t²), the
 * wire catches it a little below its hanging height and pulls it back. It swings out from the first frame of the fall
 * as a pendulum does from rest, −16°·sin(π/2·u), so it arrives at the extreme with zero angular velocity — the state
 * the pendulum is released from. While falling it turns about its own wire apex, which lands on the nail.
 */
export function dropAt(frame: number, t: Timing, h: number) {
  const { from, duration } = actTimes(t).drop;
  const fall = 0.62;
  const stretch = 16;
  const u = Math.max(0, Math.min(1, (frame - from) / duration));
  const angle = SWING_FROM * Math.sin((Math.PI / 2) * u);
  if (u <= fall) {
    const q = u / fall;
    return { top: mix(dropStartTop(h), FRAME_TOP + stretch, q * q), angle };
  }
  const v = (u - fall) / (1 - fall);
  return { top: FRAME_TOP + (stretch * (1 + Math.cos(Math.PI * v))) / 2, angle };
}

type Pt = { x: number; y: number };

/** Wire from the nail to the corners of a frame turned by `angle` about its own apex (= the nail once it hangs). */
export function hangingWire(nail: Pt, rect: Rect, angle: number) {
  const pivot = { x: rect.x + rect.w / 2, y: rect.y - APEX };
  const a = (angle * Math.PI) / 180;
  const rot = (p: Pt) => ({
    x: pivot.x + (p.x - pivot.x) * Math.cos(a) - (p.y - pivot.y) * Math.sin(a),
    y: pivot.y + (p.x - pivot.x) * Math.sin(a) + (p.y - pivot.y) * Math.cos(a),
  });
  const l = rot({ x: rect.x, y: rect.y });
  const r = rot({ x: rect.x + rect.w, y: rect.y });
  const f = (q: Pt) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  return `M${f(l)}L${f(nail)}L${f(r)}`;
}

/** Rotation origin of the frame (its wire apex), relative to its top-left. */
export const apexOrigin = (rect: Rect) => ({ x: rect.w / 2, y: -APEX });
