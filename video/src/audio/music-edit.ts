// Music edit by bars (brief 9.1): the track is cut into segments on bar lines and glued with a
// 3-frame crossfade. `fromBar` counts bars of the SOURCE track from its first downbeat.
// Replace the segments once the licensed track is in public/audio/music.wav.

export type MusicSegment = { fromBar: number; bars: number };

export const MUSIC = {
  file: "audio/music.wav",
  /** Seconds from the start of the file to its first downbeat. */
  firstDownbeat: 0,
  stems: { drums: "audio/stems/drums.wav", bass: "audio/stems/bass.wav", music: "audio/stems/music.wav" },
  /** Crossfade between segments, frames at 60 fps (scaled for 50 fps). */
  crossfade: 3,
} as const;

/** Energy map (brief 9.1): 1–2 groove · 3–4 verse · 5–6 chorus (drop) · 7 break · 8–9 build · 10–11 final chorus · 12 tail. */
export const REELS_EDIT: MusicSegment[] = [{ fromBar: 0, bars: 12 }];

/** 1–2 intro (filtered) · 3–8 verse · 9–12 chorus · 13–17 break · 18–19 build · 20 hit · 21–22 tail. */
export const PROMO_EDIT: MusicSegment[] = [{ fromBar: 0, bars: 22 }];

/** Bars (1-based, of the video) where drums are ducked −12 dB when stems exist: the calm scenes. */
export const REELS_CALM_BARS = [3, 4, 7];
export const PROMO_CALM_BARS = [1, 2, 13, 14, 15, 16, 17];
