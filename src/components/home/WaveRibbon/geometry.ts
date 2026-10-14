// Fixed ribbon settings from the prototype CONFIG: loopCurve 40, loopRibbonWidth 60, loopFontSize 34, loopSpeed 60.
const CURVE = 40;
const BAND = 60;
const amplitude = CURVE * 1.1;
const pad = BAND / 2 + 12;
const height = Math.round(2 * (amplitude + pad));

export const RIBBON = { amplitude, height, cy: height / 2, speed: 60 } as const;
