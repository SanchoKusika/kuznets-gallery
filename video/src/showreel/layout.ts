import type { CSSProperties } from "react";
import paletteJson from "../data/palette.json";
import { fonts } from "../theme/fonts";

// The Showreel (1080×1920, 120 BPM, 30 beats = 15 s): a motion-design reel of the gallery — every chapter a
// different technique, all cut on the beat. Scene starts in beats.

export const SR_BPM = 120;
export const SR_BEATS = 30;

export const SR = {
  dot: 0,
  type: 2,
  shapes: 5,
  slices: 9,
  ring: 13,
  wall: 17,
  words: 21,
  logo: 25,
} as const;

/** Chapters for the HUD counter (the logo is the end card, not a chapter). */
export const CHAPTERS = [SR.dot, SR.type, SR.shapes, SR.slices, SR.ring, SR.wall, SR.words] as const;

export const palette = paletteJson as Record<string, { vivid: string; deep: string }>;

export const CX = 540;
export const CY = 980;

/** Display caps: Onest 800, tight. */
export const caps = (size: number, color: string): CSSProperties => ({
  fontFamily: fonts.sans,
  fontWeight: 800,
  fontSize: size,
  letterSpacing: "-0.04em",
  lineHeight: 0.86,
  color,
  textTransform: "uppercase",
});

/** Display lower case. */
export const lower = (size: number, color: string): CSSProperties => ({ ...caps(size, color), textTransform: "lowercase", letterSpacing: "-0.05em" });
