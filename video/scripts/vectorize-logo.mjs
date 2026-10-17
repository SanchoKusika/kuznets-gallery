// Logo PNG → SVG paths split into parts for animation: src/brand/logo-parts.ts.
//
//   npm run logo:vectorize
//
// 1. Upscale ×8 (lanczos). 2. One mask per connected area of the PNG (they do not touch).
// 3. potrace → path, scaled back to the source's 499×192. 4. QA: render the parts over the PNG
// and diff the outlines → out/qa/logo-diff.png (red = mismatch), max mismatch printed in source px.

import fs from "node:fs";
import path from "node:path";
import potrace from "potrace";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const SRC = path.resolve(root, "../src/assets/logo.png");
const UP = 8;

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// The logo sits on an opaque white plate: ink = anything far enough from white.
const px = (i) => [data[i * C], data[i * C + 1], data[i * C + 2], data[i * C + 3] / 255];
const onWhite = (i) => {
  const [r, g, b, a] = px(i);
  return [255 - (255 - r) * a, 255 - (255 - g) * a, 255 - (255 - b) * a];
};
const inkiness = (i) => {
  const [r, g, b] = onWhite(i);
  return Math.max(255 - r, 255 - g, 255 - b);
};

// Connected areas (4-neighbour) of solid ink, then the faint anti-aliased halo is shared out
// to the nearest area (multi-source BFS, ≤ 3 px) so neighbouring letters never merge.
const CORE = 90;
const label = new Int32Array(W * H).fill(-1);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const neighbours = (j) => {
  const x = j % W;
  const y = (j - x) / W;
  return N4.map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < W && ny < H).map(([nx, ny]) => ny * W + nx);
};
const seeds = [];
for (let i = 0; i < W * H; i++) {
  if (label[i] >= 0 || inkiness(i) < CORE) continue;
  const id = seeds.length;
  const stack = [i];
  label[i] = id;
  let n = 0;
  while (stack.length) {
    const j = stack.pop();
    n++;
    for (const k of neighbours(j)) if (label[k] < 0 && inkiness(k) >= CORE) (label[k] = id), stack.push(k);
  }
  seeds.push(n);
}
const dist = new Int32Array(W * H).fill(-1);
let front = [];
for (let i = 0; i < W * H; i++) if (label[i] >= 0) (dist[i] = 0), front.push(i);
for (let step = 1; step <= 3 && front.length; step++) {
  const next = [];
  for (const j of front)
    for (const k of neighbours(j))
      if (label[k] < 0 && inkiness(k) >= 4) (label[k] = label[j]), (dist[k] = step), next.push(k);
  front = next;
}
const comps = [];
for (let id = 0; id < seeds.length; id++) {
  if (seeds[id] < 12) continue; // specks
  const members = [];
  for (let i = 0; i < W * H; i++) if (label[i] === id) members.push(i);
  const xs = members.map((j) => j % W);
  const ys = members.map((j) => Math.floor(j / W));
  // Part colour: the most frequent solid colour of its core (each letter keeps its own shade).
  const counts = new Map();
  for (const j of members) {
    if (inkiness(j) < CORE || data[j * C + 3] < 250) continue;
    const key = onWhite(j).join(",");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const color = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
  comps.push({ id, members, bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) + 1, Math.max(...ys) + 1], color });
}

const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
const sat = (c) => Math.max(...c) - Math.min(...c);

function kindOf({ bbox: [x0, y0, x1, y1], color }) {
  const cy = (y0 + y1) / 2;
  if (sat(color) > 60 && color[2] < 160 && color[0] > 200 && color[1] > 200) return "wave";
  if (sat(color) > 60) return "o-dot";
  if (cy < 112) return "letter";
  if (x1 < 200 && x1 - x0 < 16) return "bead";
  return "gallery";
}

// Coverage of a part's colour over white for every source pixel of that part (0…1).
function coverage(i, color) {
  const p = onWhite(i);
  const d = color.map((v) => 255 - v);
  const q = p.map((v) => 255 - v);
  const dd = d.reduce((s, v) => s + v * v, 0);
  return Math.max(0, Math.min(1, q.reduce((s, v, k) => s + v * d[k], 0) / dd));
}

const traceBuffer = (buf) =>
  new Promise((resolve, reject) => {
    const t = new potrace.Potrace({ threshold: 128, turdSize: 4, optTolerance: 0.2, alphaMax: 1 });
    t.loadImage(buf, (err) => (err ? reject(err) : resolve(t.getPathTag("#000"))));
  });

const parts = [];
for (const comp of comps) {
  const kind = kindOf(comp);
  // Grey source mask of this part only (ink = black), padded, upscaled ×8 with lanczos.
  const [x0, y0, x1, y1] = comp.bbox;
  const pad = 3;
  const bw = x1 - x0 + 2 * pad;
  const bh = y1 - y0 + 2 * pad;
  const mask = Buffer.alloc(bw * bh, 255);
  const own = new Set(comp.members);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const sx = x0 - pad + x;
      const sy = y0 - pad + y;
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const i = sy * W + sx;
      // Pixels of other parts never leak in; faint halo around this part counts.
      if (label[i] >= 0 && !own.has(i)) continue;
      if (label[i] < 0 && inkiness(i) < 4) continue;
      mask[y * bw + x] = Math.round(255 * (1 - coverage(i, comp.color)));
    }
  const up = await sharp(mask, { raw: { width: bw, height: bh, channels: 1 } })
    .resize(bw * UP, bh * UP, { kernel: "lanczos3" })
    .png()
    .toBuffer();
  const tag = await traceBuffer(up);
  const d0 = tag.match(/ d="([^"]+)"/)[1];
  // Back to logo coordinates: ÷8, then shift by the crop's origin.
  const dAbs = transform(d0, 1 / UP, x0 - pad, y0 - pad);
  parts.push({ kind, d: dAbs, fill: hex(comp.color), bbox: comp.bbox, cx: (x0 + x1) / 2 });
}

function transform(d, k, tx, ty) {
  // potrace emits absolute M/C/L/Z only: scale and shift every x,y pair.
  if (/[a-yA-Y]/.test(d.replace(/[MCL]/g, ""))) throw new Error("unexpected path command in potrace output");
  return d
    .replace(/([MCL])([^MCLZ]*)/g, (_, cmd, args) => {
      const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      return cmd + nums.map((v, i) => Math.round((v * k + (i % 2 === 0 ? tx : ty)) * 100) / 100).join(" ") + " ";
    })
    .replace(/\s+Z/g, "Z")
    .trim();
}

// Order: letters left→right, dot, wave, beads, GALLERY.
const order = { letter: 0, "o-dot": 1, wave: 2, bead: 3, gallery: 4 };
parts.sort((a, b) => order[a.kind] - order[b.kind] || a.cx - b.cx);
const counters = {};
const out = parts.map((p) => {
  counters[p.kind] = (counters[p.kind] ?? 0) + 1;
  const n = counters[p.kind];
  const id = p.kind === "letter" ? `letter-${"KUZNETSOVS"[n - 1]}${n}` : p.kind === "gallery" ? `gallery-${"GALLERY"[n - 1]}${n}` : `${p.kind}-${n}`;
  return { id, kind: p.kind, d: p.d, fill: p.fill, bbox: p.bbox };
});

const counts = Object.entries(counters).map(([k, v]) => `${k} ${v}`).join(", ");
console.log(counts);
const expected = { letter: 10, "o-dot": 1, wave: 1, bead: 3, gallery: 7 };
for (const [k, v] of Object.entries(expected)) if (counters[k] !== v) console.warn(`! expected ${v} × ${k}, got ${counters[k] ?? 0}`);

const ts =
  `// Generated by scripts/vectorize-logo.mjs from src/assets/logo.png — do not edit by hand.\n` +
  `// Coordinates in the source's ${W}×${H} px; bbox = [x0, y0, x1, y1].\n\n` +
  `export type LogoPartKind = "letter" | "o-dot" | "wave" | "bead" | "gallery";\n\n` +
  `export type LogoPart = {\n  id: string;\n  kind: LogoPartKind;\n  d: string;\n  fill: string;\n  bbox: [number, number, number, number];\n};\n\n` +
  `export const LOGO_SIZE = { w: ${W}, h: ${H} } as const;\n\n` +
  `export const logoParts: LogoPart[] = ${JSON.stringify(out, null, 2)};\n`;
fs.writeFileSync(path.join(root, "src/brand/logo-parts.ts"), ts);

// QA: rasterise the vector at ×4 and compare the ink mask with the PNG's.
const K = 4;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * K}" height="${H * K}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>${out.map((p) => `<path d="${p.d}" fill="#000" fill-rule="evenodd"/>`).join("")}</svg>`;
const vec = await sharp(Buffer.from(svg)).flatten({ background: "#fff" }).extractChannel(0).raw().toBuffer();
const refMask = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) {
  const comp = comps.find((c) => c.id === label[i]);
  refMask[i] = comp && coverage(i, comp.color) >= 0.5 ? 0 : 255;
}
const ref = await sharp(refMask, { raw: { width: W, height: H, channels: 1 } }).resize(W * K, H * K, { kernel: "lanczos3" }).extractChannel(0).raw().toBuffer();
const WK = W * K;
const HK = H * K;
const xor = new Uint8Array(WK * HK);
for (let i = 0; i < WK * HK; i++) xor[i] = (vec[i] < 128) !== (ref[i] < 128) ? 1 : 0;
// Thickness of the mismatch: largest square fully inside the XOR region (in source px).
let maxRun = 0;
const dp = new Uint16Array(WK * HK);
for (let y = 0; y < HK; y++)
  for (let x = 0; x < WK; x++) {
    const i = y * WK + x;
    if (!xor[i]) continue;
    dp[i] = x && y ? 1 + Math.min(dp[i - 1], dp[i - WK], dp[i - WK - 1]) : 1;
    maxRun = Math.max(maxRun, dp[i]);
  }
const rgb = Buffer.alloc(WK * HK * 3);
for (let i = 0; i < WK * HK; i++) {
  const v = ref[i] < 128 ? 170 : 255;
  rgb.set(xor[i] ? [224, 40, 40] : [v, v, v], i * 3);
}
fs.mkdirSync(path.join(root, "out/qa"), { recursive: true });
await sharp(rgb, { raw: { width: WK, height: HK, channels: 3 } }).png().toFile(path.join(root, "out/qa/logo-diff.png"));
console.log(`logo-parts.ts: ${out.length} parts; max outline mismatch ≈ ${(maxRun / K).toFixed(2)} source px → out/qa/logo-diff.png`);
