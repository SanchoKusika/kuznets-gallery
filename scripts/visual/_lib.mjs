// Shared setup for the prototype-vs-app checks.
// Env: CHROME_PATH (system Chrome), PROTO_URL, APP_URL, WITH_IMAGES (load catalogue photos).
import { chromium } from "playwright-core";

export const PROTO_URL = process.env.PROTO_URL || "http://localhost:4000/Kuznetsovs%20Gallery.dc.html";
export const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const launch = () =>
  chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });

/**
 * Opens `url` with the theme (and, for the prototype, its stored route) preset in localStorage,
 * waits for the network, fonts and a settle delay. Returns { ctx, page }; close ctx when done.
 */
export async function open(browser, url, { width, height = 900, theme = "light", route = "", reducedMotion = "reduce", settle = 1200 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
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
  // Catalogue photos come from kuznets.uz and differ anyway (JPEG vs optimised WebP);
  // skip them so the host's availability doesn't matter. WITH_IMAGES=1 keeps them.
  if (!process.env.WITH_IMAGES) {
    await ctx.route(/kuznets\.uz\/wp-content|\/_next\/image\?url=https?%3A%2F%2Fkuznets\.uz/, (r) => r.abort());
  }
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("header");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(settle);
  return { ctx, page };
}

/** Both sides of a comparison: [name, url, prototype route]. */
export const sides = (appPath = "/", protoRoute = "") => [
  ["proto", PROTO_URL, protoRoute],
  ["app", APP_URL + appPath, ""],
];
