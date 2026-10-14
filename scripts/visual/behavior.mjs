// App-only behaviour checks: theme toggle + persistence, Контакты scroll, active nav, mobile menu
// (Esc, resize, navigation) and console errors / failed requests. Usage: node behavior.mjs
import { APP_URL, launch, skipRemotePhotos } from "./_lib.mjs";
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await skipRemotePhotos(ctx);
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/_next\/image|kuznets\.uz/.test(m.location().url || "")) logs.push(m.type() + ": " + m.text().slice(0, 300) + " @ " + (m.location().url || "")); });
page.on("response", (res) => { if (res.status() >= 400) logs.push("HTTP " + res.status() + " " + res.url()); });
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
await page.goto(APP_URL + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const r = {};
r.themeBefore = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
await page.locator('header button[role="switch"]').first().click();
await page.waitForTimeout(1000);
r.themeAfter = await page.evaluate(() => [document.documentElement.getAttribute("data-theme"), localStorage.getItem("kz_theme"), document.querySelector('header button[role="switch"]').getAttribute("aria-checked")]);
await page.reload({ waitUntil: "domcontentloaded" });
r.themeAtDCL = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
r.themeAfterHydrate = await page.evaluate(() => [document.documentElement.getAttribute("data-theme"), document.querySelector('header button[role="switch"]').getAttribute("aria-checked")]);
// contacts
await page.locator('header a[href="#contacts"]').first().click();
await page.waitForTimeout(1500);
r.scrolledToBottom = await page.evaluate(() => Math.round(scrollY + innerHeight) >= document.body.scrollHeight - 2);
r.headerScrolled = await page.evaluate(() => getComputedStyle(document.querySelector('header > div')).paddingTop);
// nav active
await page.locator('header nav a[href="/collection"]').click();
await page.waitForURL("**/collection"); await page.waitForTimeout(500);
r.activeBg = await page.evaluate(() => getComputedStyle(document.querySelector('header nav a[href="/collection"]')).backgroundColor);
// mobile menu: Esc + resize close
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(300);
await page.locator('button[aria-label="Открыть меню"]').click();
await page.waitForTimeout(400);
await page.keyboard.press("Escape");
await page.waitForTimeout(700);
r.escClosed = await page.evaluate(() => !document.querySelector('[data-sm="panel"]') && !document.documentElement.hasAttribute("data-scroll-lock"));
await page.locator('button[aria-label="Открыть меню"]').click();
await page.waitForTimeout(300);
await page.setViewportSize({ width: 1100, height: 800 });
await page.waitForTimeout(300);
r.resizeClosed = await page.evaluate(() => !document.querySelector('[data-sm="panel"]') && !document.documentElement.hasAttribute("data-scroll-lock"));
// menu link navigates + closes
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(300);
await page.locator('button[aria-label="Открыть меню"]').click();
await page.waitForTimeout(1600);
await page.locator('[data-sm="panel"] a[href="/info"]').click();
await page.waitForTimeout(900);
r.menuNav = await page.evaluate(() => [location.pathname, !document.querySelector('[data-sm="panel"]')]);
console.log(JSON.stringify(r, null, 1));
console.log(logs.join("\n") || "no console errors/warnings");
await browser.close();
