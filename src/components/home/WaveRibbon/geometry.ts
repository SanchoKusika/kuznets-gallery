// Desktop ribbon settings from the prototype CONFIG: loopCurve 40, loopRibbonWidth 60, loopFontSize 34.
// Narrow screens (viewBox < COMPACT_BELOW) get a flatter, thinner ribbon with smaller text.
// The SVG heights (172 / 129) are mirrored in WaveRibbon.module.scss to reserve space before mount.
export const COMPACT_BELOW = 768;

function ribbon(curve: number, band: number, fontSize: number) {
  const amplitude = curve * 1.1;
  const height = Math.round(2 * (amplitude + band / 2 + 12));
  return { amplitude, band, fontSize, height, cy: height / 2 } as const;
}

const DESKTOP = ribbon(40, 60, 34);
const COMPACT = ribbon(24, 52, 28);

export const ribbonFor = (vb: number) => (vb < COMPACT_BELOW ? COMPACT : DESKTOP);
