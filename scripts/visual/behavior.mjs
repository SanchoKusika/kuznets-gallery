// App-only behaviour checks: theme toggle + persistence, Контакты scroll, active nav, mobile menu
// (Esc, resize, navigation), request drawer, motion (reveal, wave, cursor, Lenis), the 404 page and
// console errors / failed requests. Usage: node behavior.mjs
import { APP_URL, launch, skipRemotePhotos } from "./_lib.mjs";
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await skipRemotePhotos(ctx);
const page = await ctx.newPage();
const logs = [];
// Ignored: catalogue photos (blocked) and two dev-only notices: a reload (Cache-Control: no-cache)
// bypasses server caches, and the 404 page's CSS chunk is preloaded on every page.
page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && !/_next\/image|kuznets\.uz/.test(m.location().url || "") && !/server caches disabled|preloaded using link preload/.test(m.text()) && !/\/nope$|\/kz-999$/.test(m.location().url || "")) logs.push(m.type() + ": " + m.text().slice(0, 300) + " @ " + (m.location().url || "")); });
page.on("response", (res) => { if (res.status() >= 400 && !/\/nope$|\/kz-999$/.test(res.url())) logs.push("HTTP " + res.status() + " " + res.url()); });
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
// request drawer: open from «Покупателям», Esc / scrim close, add from a work, persistence, validation, send
await page.setViewportSize({ width: 1280, height: 800 });
const drawer = () => page.evaluate(() => {
  const a = document.querySelector('aside[aria-label="Заявка"]');
  return a && { lines: a.querySelectorAll('button[aria-label="Убрать"]').length, text: a.innerText.replace(/\s+/g, " ").slice(0, 90), focused: a.contains(document.activeElement) };
});
await page.getByRole("button", { name: "Обсудить размер" }).click();
await page.waitForTimeout(700);
r.drawerOpen = await drawer();
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
r.drawerEscClosed = !(await drawer());
await page.goto(APP_URL + "/work/kz-001", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Добавить в заявку/ }).click();
await page.waitForTimeout(700);
r.drawerAdded = await drawer();
await page.mouse.click(100, 400);
await page.waitForTimeout(600);
r.drawerScrimClosed = !(await drawer());
await page.reload({ waitUntil: "networkidle" });
r.countAfterReload = await page.evaluate(() => document.querySelector("header button:has(svg) + *, header button")?.closest("header").innerText.match(/Заявка\s*(\d+)/)?.[1]);
await page.locator("header button", { hasText: "Заявка" }).first().click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: /Отправить заявку/ }).click();
r.drawerError = await page.evaluate(() => document.querySelector('aside [role="alert"]')?.innerText);
await page.getByPlaceholder("Ваше имя").fill("Алексей");
await page.getByPlaceholder("+998 __ ___ __ __").fill("90 316");
await page.getByRole("button", { name: /Отправить заявку/ }).click();
r.drawerPhoneError = await page.evaluate(() => document.querySelector('aside [role="alert"]')?.innerText);
await page.getByPlaceholder("+998 __ ___ __ __").fill("+998 90 316 59 13");
await page.getByPlaceholder("Комментарий: идея, размер, интерьер").fill("В гостиную");
const sent = page.waitForResponse((res) => res.url().endsWith("/api/requests"));
await page.getByRole("button", { name: /Отправить заявку/ }).click();
r.apiStatus = (await sent).status();
await page.waitForTimeout(300);
r.drawerThanks = await drawer();
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
await page.locator("header button", { hasText: "Заявка" }).first().click();
await page.waitForTimeout(700);
r.drawerAfterSend = [await drawer(), await page.getByPlaceholder("Комментарий: идея, размер, интерьер").inputValue(), await page.evaluate(() => localStorage.getItem("kz_order"))];
// motion: reveal lifted the pre-paint hiding, Lenis runs, the wave moves in view and can be turned, cursor grows
await page.keyboard.press("Escape");
await page.goto(APP_URL + "/", { waitUntil: "networkidle" });
r.motionReady = await page.evaluate(() => [!document.documentElement.hasAttribute("data-motion"), document.documentElement.classList.contains("lenis")]);
const ribbon = page.locator('[title="Потяните, чтобы изменить направление"]');
await ribbon.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
const offset = () => page.evaluate(() => parseFloat(document.querySelector("textPath").getAttribute("startOffset")));
const o1 = await offset();
await page.waitForTimeout(300);
const o2 = await offset();
const box = await ribbon.boundingBox();
await page.mouse.move(box.x + 300, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + 500, box.y + box.height / 2, { steps: 5 });
await page.mouse.up();
const o3 = await offset();
await page.waitForTimeout(300);
r.waveRunsLeftThenRight = [o2 < o1 || o2 - o1 > 100, (await offset()) > o3];
const thumb = await page.locator('[data-cursor="Смотреть"]').first();
await thumb.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
const tb = await thumb.boundingBox();
await page.mouse.move(tb.x + 20, tb.y + 20, { steps: 3 });
await page.waitForTimeout(500);
r.cursorLabel = await page.evaluate(() => document.querySelector('[class*="cursor__dot"]').textContent);
// 404: status, standalone and inside the site layout (unknown work), straighten, hang a work, open it
for (const path of ["/nope", "/work/kz-999"]) {
  const res = await page.goto(APP_URL + path, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Поправить раму" }).click();
  await page.getByRole("button", { name: /Повесить/ }).click();
  await page.waitForTimeout(300);
  r[`notFound ${path}`] = await page.evaluate(([status]) => [
    status,
    document.querySelectorAll("header:not([hidden])").length - [...document.querySelectorAll("header")].filter((h) => !h.offsetParent).length,
    document.querySelector("footer:last-of-type").innerText.replace(/\s+/g, " "),
    document.querySelector('[role="img"]').getAttribute("aria-label"),
  ], [res.status()]);
}
const artLink = page.getByRole("link", { name: "Открыть эту картину →" });
const artHref = await artLink.getAttribute("href");
await artLink.click();
await page.waitForURL(APP_URL + artHref);
r.notFoundOpensWork = [artHref, await page.locator("h1").first().innerText()];
console.log(JSON.stringify(r, null, 1));
console.log(logs.join("\n") || "no console errors/warnings");
await browser.close();
