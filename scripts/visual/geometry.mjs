// Usage: node geometry.mjs <widths> <appPath> <protoRoute-json-or-empty> [theme]
// Compares top/height of main's children, the section after main, and the footer.
import { chromium } from "playwright-core";

const [widthsArg = "1440,1280,960,768,600,375", appPath = "/", protoRoute = "", theme = "light"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });

async function measure(url, width, route) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(
    ([t, r]) => {
      localStorage.setItem("kz_theme", t);
      if (r) localStorage.setItem("kz_route", r);
    },
    [theme, route],
  );
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("main");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    const main = document.querySelector("main");
    const els = [...main.children];
    let n = main.nextElementSibling;
    while (n) { els.push(n); n = n.nextElementSibling; }
    return els
      .filter((e) => e.getBoundingClientRect().height > 0 && getComputedStyle(e).position !== "fixed")
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { tag: e.tagName.toLowerCase(), top: +(r.top + scrollY).toFixed(2), h: +r.height.toFixed(2), w: +r.width.toFixed(2) };
      });
  });
  await ctx.close();
  return out;
}

for (const w of widthsArg.split(",").map(Number)) {
  const p = await measure("http://localhost:4000/Kuznetsovs%20Gallery.dc.html", w, protoRoute);
  const a = await measure("http://localhost:3000" + appPath, w, "");
  const lines = [];
  const n = Math.max(p.length, a.length);
  for (let i = 0; i < n; i++) {
    const x = p[i], y = a[i];
    const bad = !x || !y || Math.abs(x.h - y.h) > 0.5 || Math.abs(x.top - y.top) > 0.5;
    if (bad) lines.push(`  #${i} proto ${x ? `${x.tag} top ${x.top} h ${x.h}` : "-"} | app ${y ? `${y.tag} top ${y.top} h ${y.h}` : "-"}`);
  }
  console.log(`${w}: ${lines.length ? "MISMATCH\n" + lines.join("\n") : `OK (${n} blocks)`}`);
}
await browser.close();
