// Usage: node probe.mjs <width> <jsExpr returning JSON-able> [appPath] [protoRoute] [theme]
import { chromium } from "playwright-core";

const [width, expr, appPath = "/", protoRoute = "", theme = "light"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
for (const [name, url] of [
  ["proto", "http://localhost:4000/Kuznetsovs%20Gallery.dc.html"],
  ["app", "http://localhost:3000" + appPath],
]) {
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(
    ([t, r]) => {
      localStorage.setItem("kz_theme", t);
      if (r) localStorage.setItem("kz_route", r);
    },
    [theme, name === "proto" ? protoRoute : ""],
  );
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("header");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const out = await page.evaluate(`(() => { const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [+b.x.toFixed(2), +b.y.toFixed(2), +b.width.toFixed(2), +b.height.toFixed(2)]; }; return ${expr}; })()`);
  console.log(name, JSON.stringify(out));
  await ctx.close();
}
await browser.close();
