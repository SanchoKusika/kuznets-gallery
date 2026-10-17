import { Easing, interpolate } from "remotion";

// The site's curves (_tokens.scss → --ease-*).
export const ease = {
  out: Easing.bezier(0.2, 0.7, 0.2, 1),
  rise: Easing.bezier(0.16, 0.84, 0.24, 1),
  inOut: Easing.bezier(0.6, 0, 0.3, 1),
  menuIn: Easing.bezier(0.22, 1, 0.36, 1),
  menuOut: Easing.bezier(0.76, 0, 0.24, 1),
  in: Easing.bezier(0.5, 0, 0.75, 0),
  linear: (t: number) => t,
} as const;

export type EaseFn = (t: number) => number;

/** 0→1 over [from, from + duration] with an easing, clamped both sides. */
export const progress = (frame: number, from: number, duration: number, easing: EaseFn = ease.out) =>
  duration <= 0
    ? frame >= from
      ? 1
      : 0
    : interpolate(frame, [from, from + duration], [0, 1], {
        easing,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

/** Linear mix of two numbers. */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
