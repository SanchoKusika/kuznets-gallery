import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// Swinging frame (brief 6.3) with the site's 404 formula: v += (rest − a)·k; v *= d; a += v, rest 0,
// stepped at a fixed 60 Hz. k and d are tuned so the half-period is exactly one beat at 100 BPM
// (extremes at steps 36, 72, 108, 144) and the frame nearly settles in four half-periods
// (−16° → 9.2°, −5.3°, 3.0°, −1.7°).
export const PENDULUM = { k: 0.00786, d: 0.97, stepHz: 60 } as const;

/** Angles (deg) at every 60 Hz step from a0 with v0 = 0. */
export function pendulumSteps(a0: number, steps: number, k: number = PENDULUM.k, d: number = PENDULUM.d) {
  const out = new Float64Array(steps + 1);
  let a = a0;
  let v = 0;
  out[0] = a;
  for (let i = 1; i <= steps; i++) {
    v += (0 - a) * k;
    v *= d;
    a += v;
    out[i] = a;
  }
  return out;
}

/**
 * Pendulum angle at the current frame: released at `start` (frame relative to the Sequence) from
 * `a0` degrees; before that it holds a0. Sampled by time, so 50 fps sees the same motion.
 */
export function usePendulum(start: number, a0: number, seconds = 8) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps = useMemo(() => pendulumSteps(a0, Math.ceil(seconds * PENDULUM.stepHz)), [a0, seconds]);
  const s = ((frame - start) / fps) * PENDULUM.stepHz;
  if (s <= 0) return a0;
  const i = Math.floor(s);
  if (i >= steps.length - 1) return steps[steps.length - 1];
  return steps[i] + (steps[i + 1] - steps[i]) * (s - i);
}
