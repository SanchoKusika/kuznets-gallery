import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import { loadFont as loadPiazzolla } from "@remotion/google-fonts/Piazzolla";
import type { CSSProperties } from "react";

// Loaded at module level: rendering waits for the files (delayRender inside loadFont).
const onest = loadOnest("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin", "cyrillic"] });
const piazzolla = loadPiazzolla("italic", { weights: ["300"], subsets: ["latin", "cyrillic"] });

export const fonts = { sans: onest.fontFamily, serif: piazzolla.fontFamily } as const;

// Text roles as on the site (_mixins.scss).

/** Display heading: Onest, lower case, tight tracking. */
export const display = (size: number, weight: number, tracking: number, lineHeight = 0.95): CSSProperties => ({
  fontFamily: fonts.sans,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: `${tracking}em`,
  lineHeight,
  textTransform: "lowercase",
});

/** Uppercase meta label: Onest 500, tracking .1em, tabular figures. */
export const label = (size: number): CSSProperties => ({
  fontFamily: fonts.sans,
  fontSize: size,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.2,
});

/** Piazzolla Italic 300, opsz 30 — quotes, ledes, reviews. */
export const serif = (size: number, lineHeight = 1.15): CSSProperties => ({
  fontFamily: fonts.serif,
  fontStyle: "italic",
  fontWeight: 300,
  fontVariationSettings: '"opsz" 30',
  letterSpacing: "-0.01em",
  fontSize: size,
  lineHeight,
});

/** Onest body text / caption. */
export const text = (size: number, weight = 400): CSSProperties => ({
  fontFamily: fonts.sans,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 1.3,
  letterSpacing: "-0.01em",
});

/** Prices, codes, counters. */
export const tabular: CSSProperties = { fontFamily: fonts.sans, fontVariantNumeric: "tabular-nums" };
