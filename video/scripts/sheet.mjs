// Contact sheets for looking at motion (the director's and agents' review tool, not a deliverable).
//
//   node scripts/sheet.mjs <dir> <out.jpg> [cols=8] [tileWidth=240]
//     every frame of a `remotion render … --sequence` folder on one sheet, captioned with its index;
//   node scripts/sheet.mjs --files <out.jpg> <tileWidth> <cols> <file> <file> …
//     the given images side by side at one size, for close looks.
//
// Frames first: REMOTION_SILENT=1 npx remotion render Reels out/dev/<name> --sequence --frames=<a>-<b> --every-nth-frame=<k> --image-format=jpeg
// (REMOTION_SILENT drops the soundtrack: with sounds in the range --every-nth-frame fails in the audio mixer, EINVAL)

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);

if (args[0] === "--files") {
  const [, out, tw, cols, ...files] = args;
  const w = Number(tw);
  const n = Number(cols);
  const meta = await sharp(files[0]).metadata();
  const h = Math.round((meta.height * w) / meta.width);
  const tiles = await Promise.all(files.map((f) => sharp(f).resize(w, h).toBuffer()));
  const rows = Math.ceil(files.length / n);
  await sharp({ create: { width: n * w + (n - 1) * 8, height: rows * h + (rows - 1) * 8, channels: 3, background: "#888" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % n) * (w + 8), top: Math.floor(i / n) * (h + 8) })))
    .jpeg({ quality: 88 })
    .toFile(out);
  console.log(out);
} else {
  const [dir, out, colsArg, twArg] = args;
  const cols = Number(colsArg ?? 8);
  const tw = Number(twArg ?? 240);
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/.test(f)).sort();
  const meta = await sharp(path.join(dir, files[0])).metadata();
  const th = Math.round((meta.height * tw) / meta.width);
  const cap = 22;
  const tiles = await Promise.all(
    files.map(async (f, i) => {
      const img = await sharp(path.join(dir, f)).resize(tw, th).toBuffer();
      const n = Number(f.match(/(\d+)\.\w+$/)?.[1] ?? i);
      const svg = Buffer.from(
        `<svg width="${tw}" height="${cap}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/>` +
          `<text x="4" y="16" font-family="Arial" font-size="14">${n}</text></svg>`,
      );
      const left = (i % cols) * tw;
      const top = Math.floor(i / cols) * (th + cap);
      return [{ input: img, left, top }, { input: svg, left, top: top + th }];
    }),
  );
  const rows = Math.ceil(files.length / cols);
  await sharp({ create: { width: cols * tw, height: rows * (th + cap), channels: 3, background: "#fff" } })
    .composite(tiles.flat())
    .jpeg({ quality: 85 })
    .toFile(out);
  console.log(`${out}: ${files.length} frames (captions are indices: frame = first + index × every-nth)`);
}
