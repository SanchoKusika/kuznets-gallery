// Stills for review, rendered through the Remotion CLI and laid out on contact sheets in out/qa/.
//
//   npm run stills                 → styleframes.jpg (the six styleframes, brief 11)
//   npm run stills -- reels|promo  → reels-stills.jpg / promo-stills.jpg (key frames of the videos)
//   npm run stills -- safe         → safe-*.png (Reels with showGuides on the frames from brief 10)
//   npm run stills -- loop         → loop.gif (the Reels loop seam: last 30 + first 30 frames)

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const qa = path.join(root, "out/qa");
const tmp = path.join(root, "out/stills");
fs.mkdirSync(qa, { recursive: true });
fs.mkdirSync(tmp, { recursive: true });

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
function still(id, frame, out, props) {
  const args = ["remotion", "still", id, out, `--frame=${frame}`, "--log=error"];
  // Props go through a file: on Windows the shell strips the quotes of inline JSON.
  if (props) {
    const file = path.join(tmp, "props.json");
    fs.writeFileSync(file, JSON.stringify(props));
    args.push(`--props=${file}`);
  }
  execFileSync(npx, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  return out;
}

/** Contact sheet: one row per group, each image scaled to the row height, with a caption. */
async function sheet(rows, out, rowHeight) {
  const PAD = 24;
  const CAP = 44;
  const tiles = [];
  let y = PAD;
  let width = 0;
  for (const row of rows) {
    let x = PAD;
    for (const { file, caption } of row) {
      const meta = await sharp(file).metadata();
      const w = Math.round((meta.width * rowHeight) / meta.height);
      tiles.push({ input: await sharp(file).resize(w, rowHeight).toBuffer(), left: x, top: y });
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${CAP}"><text x="0" y="30" font-family="Arial" font-size="22" fill="#3A3732">${caption}</text></svg>`;
      tiles.push({ input: Buffer.from(svg), left: x, top: y + rowHeight + 6 });
      x += w + PAD;
    }
    width = Math.max(width, x);
    y += rowHeight + CAP + PAD;
  }
  await sharp({ create: { width, height: y, channels: 3, background: "#DCD7CE" } })
    .composite(tiles)
    .jpeg({ quality: 90 })
    .toFile(out);
  console.log(out);
}

const mode = process.argv[2] ?? "styleframes";

if (mode === "styleframes") {
  const reels = [
    ["Sf1ReelsHook", "1 · R1 хук (кадр 100)"],
    ["Sf2ReelsKids", "2 · R3 «для детской» (430)"],
    ["Sf3ReelsWall", "3 · R5 стена с плашкой (820)"],
    ["Sf4ReelsLogo", "4 · R8 логотип с призывом (1570)"],
  ];
  const promo = [
    ["Sf5PromoHall", "5 · P3 зал «для дома» (700)"],
    ["Sf6PromoFraming", "6 · P7 три колонки оформления (2150)"],
  ];
  const render = (list) => list.map(([id, caption]) => ({ file: still(id, 0, path.join(tmp, `${id}.png`)), caption }));
  const r = render(reels);
  const p = render(promo);
  // Reels row at 960 px high (4 × 540), Promo row at 608 px (2 × 1080).
  await sheet([r], path.join(tmp, "row-reels.png"), 960);
  await sheet([p], path.join(tmp, "row-promo.png"), 608);
  const a = await sharp(path.join(tmp, "row-reels.png")).toBuffer();
  const b = await sharp(path.join(tmp, "row-promo.png")).toBuffer();
  const ma = await sharp(a).metadata();
  const mb = await sharp(b).metadata();
  await sharp({ create: { width: Math.max(ma.width, mb.width), height: ma.height + mb.height, channels: 3, background: "#DCD7CE" } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: 0, top: ma.height }])
    .jpeg({ quality: 90 })
    .toFile(path.join(qa, "styleframes.jpg"));
  console.log(path.join(qa, "styleframes.jpg"));
} else if (mode === "loop") {
  // Reels loop seam (brief 7, R8): the last 30 and the first 30 frames, every 2nd, as a looping GIF.
  const dir = path.join(tmp, "loop");
  fs.rmSync(dir, { recursive: true, force: true });
  const range = (a, b, sub) => {
    const args = ["remotion", "render", "Reels", path.join(dir, sub), "--sequence", `--frames=${a}-${b}`, "--every-nth-frame=2", "--image-format=jpeg", "--log=error"];
    execFileSync(npx, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
    return fs.readdirSync(path.join(dir, sub)).sort().map((f) => path.join(dir, sub, f));
  };
  const frames = [...range(1698, 1727, "a"), ...range(0, 29, "b")];
  frames.forEach((f, i) => fs.renameSync(f, path.join(dir, `${String(i).padStart(3, "0")}.jpeg`)));
  const vf = "scale=360:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse";
  const args = ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", path.join(dir, "%03d.jpeg"), "-vf", vf, "-loop", "0", path.join(qa, "loop.gif")];
  execFileSync(npx, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  console.log(path.join(qa, "loop.gif"));
} else if (mode === "safe") {
  for (const f of [60, 400, 790, 950, 1150, 1600]) still("Reels", f, path.join(qa, `safe-${f}.png`), { showGuides: true });
} else if (mode === "reels" || mode === "promo") {
  const frames =
    mode === "reels"
      ? [60, 160, 300, 430, 600, 700, 820, 900, 1000, 1100, 1250, 1400, 1520, 1620, 1700, 1727]
      : [100, 250, 400, 650, 900, 1100, 1200, 1350, 1500, 1650, 1800, 2000, 2150, 2300, 2500, 2700, 2800, 3000, 3167];
  const id = mode === "reels" ? "Reels" : "Promo";
  const files = frames.map((f) => ({ file: still(id, f, path.join(tmp, `${id}-${f}.png`)), caption: `${id} ${f}` }));
  const perRow = mode === "reels" ? 8 : 5;
  const rows = [];
  for (let i = 0; i < files.length; i += perRow) rows.push(files.slice(i, i + perRow));
  await sheet(rows, path.join(qa, `${mode}-stills.jpg`), mode === "reels" ? 640 : 360);
}
