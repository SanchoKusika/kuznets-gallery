import { useVideoConfig } from "remotion";

// Music grid: everything is timed in beats, never in raw frames or seconds,
// so a 50 fps master or a different BPM needs no rework.

export const BPM = 100;

/** Frames in n beats at the given fps. */
export const beatAt = (n: number, fps: number) => Math.round((n * fps * 60) / BPM);
/** Frames in n bars (4/4). */
export const barAt = (n: number, fps: number) => beatAt(4 * n, fps);

export type Timing = {
  fps: number;
  /** n beats → frames. */
  b: (n: number) => number;
  /** n eighths (½ beat) → frames. */
  e: (n: number) => number;
  /** n sixteenths (¼ beat) → frames. */
  s: (n: number) => number;
  /** n bars → frames. */
  bar: (n: number) => number;
};

export const timingAt = (fps: number): Timing => ({
  fps,
  b: (n) => beatAt(n, fps),
  e: (n) => beatAt(n / 2, fps),
  s: (n) => beatAt(n / 4, fps),
  bar: (n) => barAt(n, fps),
});

/** Beat helpers bound to the composition's fps. */
export const useTiming = (): Timing => timingAt(useVideoConfig().fps);
