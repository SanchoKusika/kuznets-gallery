// Contact sheets of the prepared artworks with their codes: out/qa/art-contact-N.jpg (40 per sheet).
// With --circles: out/qa/circles.jpg — CircleMontage works with their circle from selection.ts drawn on top
// (circles are read from src/data/circles.json, which selection.ts imports).
//
//   node scripts/contact-sheet.mjs [--circles]

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const art = JSON.parse(fs.readFileSync(path.join(root, "src/data/art.json"), "utf8"));
const qa = path.join(root, "out/qa");
fs.mkdirSync(qa, { recursive: true });

const CELL = 300;
const LABEL = 28;
const COLS = 8;

const esc = (s) => s.replace(/[<&>"]/g, (c) => `&#${c.charCodeAt(0)};`);

async function tile(item, overlay) {
  const img = sharp(path.join(root, "public", item.file));
  const k = Math.min(CELL / item.w, (CELL - LABEL) / item.h);
  const w = Math.round(item.w * k);
  const h = Math.round(item.h * k);
  const pic = await img.resize(w, h).toBuffer();
  const color = item.excluded ? "#E0502E" : "#151515";
  const text = `${item.code}${item.excluded ? " ✕" : ""} · ${item.w}×${item.h}`;
  const svg = Buffer.from(
    `<svg width="${CELL}" height="${CELL}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="100%" height="100%" fill="#E9E5DD"/>` +
      `<text x="6" y="${CELL - 9}" font-family="Arial" font-size="15" fill="${color}">${esc(text)}</text></svg>`,
  );
  const layers = [{ input: pic, left: Math.round((CELL - w) / 2), top: 0 }];
  if (overlay) {
    const { cx, cy, r } = overlay;
    const ring = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
        `<circle cx="${cx * k}" cy="${cy * k}" r="${r * k}" fill="none" stroke="#E0502E" stroke-width="3"/></svg>`,
    );
    layers.push({ input: ring, left: Math.round((CELL - w) / 2), top: 0 });
  }
  return sharp(svg).composite(layers).png().toBuffer();
}

async function sheet(items, out, overlays = {}) {
  const rows = Math.ceil(items.length / COLS);
  const tiles = await Promise.all(items.map((it) => tile(it, overlays[it.code])));
  await sharp({ create: { width: COLS * CELL, height: rows * CELL, channels: 3, background: "#F2EFE9" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * CELL, top: Math.floor(i / COLS) * CELL })))
    .jpeg({ quality: 85 })
    .toFile(out);
  console.log(out);
}

if (process.argv.includes("--circles")) {
  const circles = JSON.parse(fs.readFileSync(path.join(root, "src/data/circles.json"), "utf8"));
  const items = Object.keys(circles).map((code) => art.find((a) => a.code === code));
  await sheet(items, path.join(qa, "circles.jpg"), circles);
} else {
  for (let i = 0; i < art.length; i += 40) await sheet(art.slice(i, i + 40), path.join(qa, `art-contact-${i / 40 + 1}.jpg`));
}
