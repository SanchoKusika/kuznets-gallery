// Env: ACTION (JS to run before the shot), ACTION_WAIT (ms), CHROME_PATH.
// Usage: node compare.mjs <outDir> <selector> [widths] [themes] [protoRoute] [appPath]
// Screenshots `selector` in the prototype and the app, writes PNGs + diff, prints mismatch %.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [outDir, selector, widthsArg = "1440,1280,960,768,600,375", themesArg = "light,dark", protoRoute = "", appPath = "/"] =
  process.argv.slice(2);
const widths = widthsArg.split(",").map(Number);
const themes = themesArg.split(",");
const PROTO = "http://localhost:4000/Kuznetsovs%20Gallery.dc.html";
const APP = "http://localhost:3000" + appPath;
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });

async function shot(url, width, theme, file, route) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await ctx.addInitScript(
    ([t, r]) => {
      try {
        localStorage.setItem("kz_theme", t);
        if (r) localStorage.setItem("kz_route", r);
        else localStorage.removeItem("kz_route");
      } catch {}
    },
    [theme, route],
  );
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  // Optional interaction before the shot: ACTION is JS run in the page (e.g. a click).
  if (process.env.ACTION) {
    await page.evaluate(process.env.ACTION);
    await page.waitForTimeout(Number(process.env.ACTION_WAIT || 1200));
  }
  await el.screenshot({ path: file, animations: "disabled" });
  await ctx.close();
}

const rows = [];
for (const theme of themes) {
  for (const w of widths) {
    const base = path.join(outDir, `${theme}-${w}`);
    await shot(PROTO, w, theme, base + "-proto.png", protoRoute);
    await shot(APP, w, theme, base + "-app.png", "");
    const a = PNG.sync.read(fs.readFileSync(base + "-proto.png"));
    const b = PNG.sync.read(fs.readFileSync(base + "-app.png"));
    if (a.width !== b.width || a.height !== b.height) {
      rows.push(`${theme} ${w}: SIZE proto ${a.width}x${a.height} vs app ${b.width}x${b.height}`);
      continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    fs.writeFileSync(base + "-diff.png", PNG.sync.write(diff));
    rows.push(`${theme} ${w}: ${a.width}x${a.height} diff ${n}px (${((n / (a.width * a.height)) * 100).toFixed(3)}%)`);
  }
}
await browser.close();
console.log(rows.join("\n"));
