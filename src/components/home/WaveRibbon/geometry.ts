// Fixed ribbon settings from the prototype CONFIG: loopCurve 40, loopRibbonWidth 60, loopFontSize 34.
// The SVG height (172) is mirrored in WaveRibbon.module.scss to reserve space before mount.
const CURVE = 40;
const band = 60;
const amplitude = CURVE * 1.1;
const height = Math.round(2 * (amplitude + band / 2 + 12));

export const RIBBON = { amplitude, band, fontSize: 34, height, cy: height / 2 } as const;
