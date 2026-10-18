// Shared positions and the camera of the Promo (brief 8). Scenes read them from here, so the hand-offs line up.

import { PROMO_SCENES } from "../timeline";
import { ease, mix, progress } from "../theme/easing";
import type { Timing } from "../theme/timing";

/** Scene starts in frames (P1 … P11; P9 was cut). */
export function sceneStarts(t: Timing) {
  return Object.fromEntries(PROMO_SCENES.map((s) => [s.id, t.bar(s.fromBar)])) as Record<"P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8" | "P10" | "P11", number>;
}

/** Halls of P3 in world px: each one screen wide, side by side on one long wall. */
export const HALLS_X = 3300;
export const hallX = (k: number) => HALLS_X + 1920 * k;

/** Speeds of the world's layers against the wall (brief 8: texts on the wall 0.6×, plants in front 1.4×). */
export const LAYER = { wall: 1, text: 0.6, plants: 1.4 } as const;

/** P1's slow push-in: 1.0 → 1.02, eased back out by P2's glide. */
export const P1_ZOOM = 0.02;

/**
 * The camera over the world (P1–P4): x of the screen's left edge in world px (wall layer). Frames are absolute.
 * P1 still; P2 glides off the frames (1.5b, menu-in) and keeps moving right at 2 px a frame (60 fps); in P3 it flies
 * to each hall (1b, menu-in) and drifts 0.5 px a frame; in P4 it whips one screen to the right after the ribbon.
 */
export function cameraX(frame: number, t: Timing) {
  const S = sceneStarts(t);
  const px = 60 / t.fps;
  if (frame < S.P2) return 0;
  const glide = (f: number) => 1500 * progress(f, S.P2, t.b(1.5), ease.menuIn) + 2 * px * (f - S.P2);
  if (frame < S.P3) return glide(frame);
  let x = glide(S.P3 - 1);
  for (let k = 0; k < 4; k++) {
    const h = S.P3 + k * t.bar(1);
    const next = k < 3 ? h + t.bar(1) : S.P4 + t.b(2);
    const at = Math.min(frame, next - 1);
    if (frame < h) break;
    x = mix(x, hallX(k), progress(at, h, t.b(1), ease.menuIn)) + 0.5 * px * Math.max(0, at - h - t.b(1));
    if (frame < next) return x;
  }
  // P4: the whip after the ribbon, then still.
  return x + 1920 * progress(frame, S.P4 + t.b(2), t.b(0.75), ease.inOut);
}

/** World zoom about the screen centre (P1's push-in, released as P2 glides). */
export function worldZoom(frame: number, t: Timing) {
  const S = sceneStarts(t);
  return 1 + P1_ZOOM * progress(frame, 0, S.P2, ease.linear) * (1 - progress(frame, S.P2, t.b(1.5), ease.inOut));
}
