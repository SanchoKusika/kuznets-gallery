// Pixel diff of one element in the prototype and the app.
// Usage: node compare.mjs <outDir> <selector> [widths] [themes] [protoRoute] [appPath]
// Env: ACTION (JS run in the page before the shot, e.g. a click), ACTION_WAIT (ms).
// Writes <outDir>/<theme>-<width>-{proto,app,diff}.png and prints the mismatch per size.
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { launch, open, sides } from "./_lib.mjs";

const [outDir, selector, widthsArg = "1440,1280,960,768,600,375", themesArg = "light,dark", protoRoute = "", appPath = "/"] =
  process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await launch();

async function shot(url, route, width, theme, file) {
  const { ctx, page } = await open(browser, url, { width, theme, route });
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  if (process.env.ACTION) {
    await page.evaluate(process.env.ACTION);
    await page.waitForTimeout(Number(process.env.ACTION_WAIT || 1200));
  }
  await el.screenshot({ path: file, animations: "disabled" });
  await ctx.close();
}

const rows = [];
for (const theme of themesArg.split(",")) {
  for (const width of widthsArg.split(",").map(Number)) {
    const base = path.join(outDir, `${theme}-${width}`);
    for (const [name, url, route] of sides(appPath, protoRoute)) await shot(url, route, width, theme, `${base}-${name}.png`);
    const a = PNG.sync.read(fs.readFileSync(`${base}-proto.png`));
    const b = PNG.sync.read(fs.readFileSync(`${base}-app.png`));
    if (a.width !== b.width || a.height !== b.height) {
      rows.push(`${theme} ${width}: SIZE proto ${a.width}x${a.height} vs app ${b.width}x${b.height}`);
      continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    fs.writeFileSync(`${base}-diff.png`, PNG.sync.write(diff));
    rows.push(`${theme} ${width}: ${a.width}x${a.height} diff ${n}px (${((n / (a.width * a.height)) * 100).toFixed(3)}%)`);
  }
}
await browser.close();
console.log(rows.join("\n"));
