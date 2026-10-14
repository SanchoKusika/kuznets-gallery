// Evaluates a JS expression in the prototype and the app and prints both results.
// Inside the expression `r(el)` returns [x, y, width, height] of an element.
// Usage: node probe.mjs <width> "<expression>" [appPath] [protoRoute] [theme]
import { launch, open, sides } from "./_lib.mjs";

const [width, expr, appPath = "/", protoRoute = "", theme = "light"] = process.argv.slice(2);
const browser = await launch();
for (const [name, url, route] of sides(appPath, protoRoute)) {
  const { ctx, page } = await open(browser, url, { width: Number(width), theme, route, settle: 800 });
  const out = await page.evaluate(
    `(() => { const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [+b.x.toFixed(2), +b.y.toFixed(2), +b.width.toFixed(2), +b.height.toFixed(2)]; }; return ${expr}; })()`,
  );
  console.log(name, JSON.stringify(out));
  await ctx.close();
}
await browser.close();
