// Music edit by bars (brief 9.1): the track is cut into segments on bar lines and glued with a
// 3-frame crossfade. `fromBar` counts bars of the SOURCE track from its first downbeat.
// The source is the project's own track (scripts/make-music.mjs, `npm run music`), 24 bars:
//   0–1 intro (filtered) · 2–7 verse · 8–11 chorus · 12–15 break · 16–17 build · 18–21 final chorus · 22–23 tail

export type MusicSegment = { fromBar: number; bars: number };

export const MUSIC = {
  file: "audio/music.wav",
  /** Seconds from the start of the file to its first downbeat. */
  firstDownbeat: 0,
  stems: { drums: "audio/stems/drums.wav", bass: "audio/stems/bass.wav", music: "audio/stems/music.wav" },
  /** Crossfade between segments, frames at 60 fps (scaled for 50 fps). */
  crossfade: 3,
} as const;

/**
 * Reels, 10 bars: 1–4 the verse's second half (its last bar has the gap before the drop) · 5–6 the chorus's second
 * half (the drop, R4–R5) · 7 break (R6) · 8 the build's last bar (the logo builds) · 9 the final chorus's downbeat hit
 * (the dot pops) · 10 the tail's last chord, Am9, which leads back into bar 1's Cmaj9 (the loop). The chorus is the
 * one that runs straight into the break in the source: cut from its first half, the full groove dropped into the
 * break mid-phrase and the sound changed abruptly at R6 (owner, 19.10).
 */
export const REELS_EDIT: MusicSegment[] = [
  { fromBar: 4, bars: 4 },
  { fromBar: 10, bars: 2 },
  { fromBar: 12, bars: 1 },
  { fromBar: 17, bars: 1 },
  { fromBar: 18, bars: 1 },
  { fromBar: 23, bars: 1 },
];

/**
 * Promo, 21 bars: 1–2 intro · 3–8 verse · 9–13 chorus (P4–P6; its last chord once more under the showroom) ·
 * 14–17 break (P7–P8) · 18 the build's last bar · 19 the hit (curtains, P10) · 20–21 tail (P11).
 */
export const PROMO_EDIT: MusicSegment[] = [
  { fromBar: 0, bars: 2 },
  { fromBar: 2, bars: 6 },
  { fromBar: 8, bars: 4 },
  { fromBar: 11, bars: 1 },
  { fromBar: 12, bars: 4 },
  { fromBar: 17, bars: 1 },
  { fromBar: 18, bars: 1 },
  { fromBar: 22, bars: 2 },
];

/** Bars (1-based, of the video) where drums are ducked −12 dB when stems exist: the calm scenes. */
export const REELS_CALM_BARS = [7];
export const PROMO_CALM_BARS = [14, 15, 16, 17];
