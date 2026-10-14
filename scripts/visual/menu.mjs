// Opens the mobile menu in both versions, screenshots mid-animation and final state, diffs final.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const out = process.argv[2];
const widths = (process.argv[3] || "375,768").split(",").map(Number);
const theme = process.argv[4] || "light";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
for (const w of widths) {
  for (const [name, url] of [
    ["proto", "http://localhost:4000/Kuznetsovs%20Gallery.dc.html"],
    ["app", "http://localhost:3000/"],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 812 } });
    await ctx.addInitScript((t) => localStorage.setItem("kz_theme", t), theme);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.locator('button[aria-label="Открыть меню"]').first().click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${out}/${w}-${name}-mid.png` });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${out}/${w}-${name}-open.png` });
    const lock = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    await page.locator('button[aria-label="Закрыть меню"]').first().click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/${w}-${name}-closing.png` });
    await page.waitForTimeout(800);
    const gone = await page.evaluate(() => !document.querySelector('[data-sm],[data-sm="panel"]'));
    const unlock = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    console.log(w, name, "lock:", lock, "after close removed:", gone, "overflow:", unlock);
    await ctx.close();
  }
  const a = PNG.sync.read(fs.readFileSync(`${out}/${w}-proto-open.png`));
  const b = PNG.sync.read(fs.readFileSync(`${out}/${w}-app-open.png`));
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  fs.writeFileSync(`${out}/${w}-diff.png`, PNG.sync.write(diff));
  console.log(w, "open-state diff", n, "px");
}
await browser.close();
