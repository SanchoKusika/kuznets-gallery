// Artworks for the videos: trims mock-up leftovers (canvas edge, shadow) off the straightened
// pictures, writes public/art/kz-xxx.jpg (no resize, JPEG q92, sRGB) and src/data/art.json.
//
//   node scripts/prepare-art.mjs [source dir]
//
// Source: the 159 straightened files «KZ-xxx — Название.jpg» (archive «Kuznets Gallery — картины ровные»).
// Default trim: 2% bottom, 1% elsewhere; per-work fractions in scripts/art-overrides.json,
// e.g. { "KZ-005": { "bottom": 0.035 } }. Check the result on out/qa/art-contact-N.jpg (npm run stills… see contact-sheet.mjs).

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = process.argv[2] ?? process.env.ART_SRC;
if (!src || !fs.existsSync(src)) throw new Error("Pass the folder with «KZ-xxx — Название.jpg» files (argument or ART_SRC)");

const DEFAULT = { top: 0.01, right: 0.01, bottom: 0.02, left: 0.01 };

/** Recognisable third-party characters, brands, photos — Meta may reject the ad (brief 3.1). */
const EXCLUDED = new Set(["KZ-077", "KZ-078", "KZ-079", "KZ-083", "KZ-173", "KZ-094", "KZ-103", "KZ-131", "KZ-117", "KZ-169"]);

const overridesFile = path.join(import.meta.dirname, "art-overrides.json");
const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, "utf8")) : {};

const outDir = path.join(root, "public/art");
fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(src)
  .filter((f) => /^KZ-\d{3} — .+\.jpe?g$/i.test(f))
  .sort();

const manifest = [];
for (const f of files) {
  const [, code, title] = f.match(/^(KZ-\d{3}) — (.+)\.jpe?g$/i);
  const trim = { ...DEFAULT, ...overrides[code] };
  const img = sharp(path.join(src, f));
  const { width: W, height: H } = await img.metadata();
  const left = Math.round(W * trim.left);
  const top = Math.round(H * trim.top);
  const w = W - left - Math.round(W * trim.right);
  const h = H - top - Math.round(H * trim.bottom);
  const file = `art/${code.toLowerCase()}.jpg`;
  await img
    .extract({ left, top, width: w, height: h })
    .toColourspace("srgb")
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(path.join(root, "public", file));
  manifest.push({ code, title, file, w, h, excluded: EXCLUDED.has(code) });
}

fs.writeFileSync(path.join(root, "src/data/art.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`${manifest.length} works → public/art, src/data/art.json (${manifest.filter((m) => m.excluded).length} excluded)`);
