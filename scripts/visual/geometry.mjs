// Compares top/height of every block of a page: main's children and main's following siblings
// (FAQ, footer…), skipping fixed and empty elements. Prints mismatches (> 0.5px) per width.
// Usage: node geometry.mjs [widths] [appPath] [protoRoute] [theme]
import { launch, open, sides } from "./_lib.mjs";

const [widthsArg = "1440,1280,960,768,600,375", appPath = "/", protoRoute = "", theme = "light"] = process.argv.slice(2);
const browser = await launch();

async function measure(url, route, width) {
  const { ctx, page } = await open(browser, url, { width, theme, route, settle: 1500 });
  const blocks = await page.evaluate(() => {
    const main = document.querySelector("main");
    const els = [...main.children];
    for (let n = main.nextElementSibling; n; n = n.nextElementSibling) els.push(n);
    return els
      .filter((e) => e.getBoundingClientRect().height > 0 && getComputedStyle(e).position !== "fixed")
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { tag: e.tagName.toLowerCase(), top: +(r.top + scrollY).toFixed(2), h: +r.height.toFixed(2) };
      });
  });
  await ctx.close();
  return blocks;
}

for (const width of widthsArg.split(",").map(Number)) {
  const results = [];
  for (const [, url, route] of sides(appPath, protoRoute)) results.push(await measure(url, route, width));
  const [proto, app] = results;
  const lines = [];
  for (let i = 0; i < Math.max(proto.length, app.length); i++) {
    const x = proto[i];
    const y = app[i];
    if (!x || !y || Math.abs(x.h - y.h) > 0.5 || Math.abs(x.top - y.top) > 0.5) {
      lines.push(`  #${i} proto ${x ? `${x.tag} top ${x.top} h ${x.h}` : "-"} | app ${y ? `${y.tag} top ${y.top} h ${y.h}` : "-"}`);
    }
  }
  console.log(`${width}: ${lines.length ? "MISMATCH\n" + lines.join("\n") : `OK (${proto.length} blocks)`}`);
}
await browser.close();
