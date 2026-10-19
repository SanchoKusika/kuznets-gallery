import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";

// Music grid: everything is timed in beats, never in raw frames or seconds,
// so a 50 fps master or a different BPM needs no rework.

/** Tempo of Reels and Promo (scripts read this line). The short reels set their own through `BpmContext`. */
export const BPM = 100;

/** Tempo of the composition being rendered; Reels and Promo use the default. */
export const BpmContext = createContext(BPM);

/** Frames in n beats at the given fps. */
export const beatAt = (n: number, fps: number, bpm = BPM) => Math.round((n * fps * 60) / bpm);
/** Frames in n bars (4/4). */
export const barAt = (n: number, fps: number, bpm = BPM) => beatAt(4 * n, fps, bpm);

export type Timing = {
  fps: number;
  bpm: number;
  /** n beats → frames. */
  b: (n: number) => number;
  /** n eighths (½ beat) → frames. */
  e: (n: number) => number;
  /** n sixteenths (¼ beat) → frames. */
  s: (n: number) => number;
  /** n bars → frames. */
  bar: (n: number) => number;
};

export const timingAt = (fps: number, bpm = BPM): Timing => ({
  fps,
  bpm,
  b: (n) => beatAt(n, fps, bpm),
  e: (n) => beatAt(n / 2, fps, bpm),
  s: (n) => beatAt(n / 4, fps, bpm),
  bar: (n) => barAt(n, fps, bpm),
});

/** Beat helpers bound to the composition's fps and tempo. */
export const useTiming = (): Timing => timingAt(useVideoConfig().fps, useContext(BpmContext));
