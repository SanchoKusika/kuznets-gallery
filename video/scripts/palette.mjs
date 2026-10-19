// Colours of every picture for the short reels: the showreel paints the frame in the colour of the work on screen.
//
//   npm run palette   → src/data/palette.json: { "KZ-001": { vivid: "#RRGGBB", deep: "#RRGGBB" }, … }
//
// vivid — the most present saturated hue (hue histogram weighted by saturation, mean colour of the winning bin);
// deep — the same hue darkened enough to carry white type.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const art = JSON.parse(fs.readFileSync(path.join(root, "src/data/art.json"), "utf8"));

function hsl([r, g, b]) {
  const mx = Math.max(r, g, b) / 255;
  const mn = Math.min(r, g, b) / 255;
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  const [R, G, B] = [r / 255, g / 255, b / 255];
  if (mx === R) h = ((G - B) / d) % 6;
  else if (mx === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function rgbOf([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}
const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

const out = {};
for (const a of art) {
  const { data } = await sharp(path.join(root, "public", a.file)).resize(48, 48, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let grey = 0;
  for (let i = 0; i < data.length; i += 3) {
    const c = [data[i], data[i + 1], data[i + 2]];
    const [h, s, l] = hsl(c);
    // Near-white, near-black and grey pixels do not vote for a hue.
    const w = s * (1 - Math.abs(2 * l - 1));
    if (w < 0.12) {
      grey++;
      continue;
    }
    const bin = bins[Math.floor(h / 15) % 24];
    bin.w += w;
    bin.r += c[0] * w;
    bin.g += c[1] * w;
    bin.b += c[2] * w;
  }
  const best = bins.reduce((m, b) => (b.w > m.w ? b : m), bins[0]);
  let vivid = best.w > 0 ? [best.r / best.w, best.g / best.w, best.b / best.w].map(Math.round) : [40, 40, 44];
  let [h, s, l] = hsl(vivid);
  // A grey picture (or a pale one) still gets a usable colour: keep its hue, lift the saturation a little.
  if (best.w < 8 || grey > 0.85 * 48 * 48) [s, l] = [Math.min(s, 0.25), 0.4];
  vivid = rgbOf([h, Math.min(1, Math.max(s, 0.45)), Math.min(0.62, Math.max(l, 0.42))]);
  const deep = rgbOf([h, Math.min(0.85, Math.max(s, 0.4)), 0.24]);
  out[a.code] = { vivid: hex(vivid), deep: hex(deep) };
}
fs.writeFileSync(path.join(root, "src/data/palette.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`palette.json: ${Object.keys(out).length} works`);
