// Demo requests for developing the admin dashboard — the prototype's archive() and seed() from
// design/Admin.dc.html: ~600 completed orders over two years (same random seed, so the same numbers)
// and ten open requests in different stages. Demo requests are numbered up to № 1048; real ones
// start at № 1049 (request_no_seq), so the two never mix. Never run against production data.
//
//   node --env-file=.env.local scripts/db/demo.mjs           replace the demo requests
//   node --env-file=.env.local scripts/db/demo.mjs --purge   only delete them

import { adminClient, must } from "./client.mjs";

const LAST_DEMO_NO = 1048;
const H = 36e5;
const D = 24 * H;
const FR = ["Холст на подрамнике", "Холст с подрамником + багет", "Бумага в рамке под стеклом"];
const NAMES = ["Дилноза К.", "Азиз Р.", "Ойбек Н.", "Екатерина Л.", "Тимур Ю.", "Шахноза А.", "Малика Т.", "Шахзод А.", "Ольга П.", "Жасур Х.", "Нигора И.", "Руслан К.", "Камола С.", "Бехзод М.", "Анна В.", "Санжар Т.", "Лола Р.", "Фаррух Д.", "Мария С.", "Улугбек А.", "Зарина Х.", "Дмитрий О.", "Севара Н.", "Алишер Б.", "Гульнора Ш.", "Сардор И.", "Наталья Г.", "Отабек Ю.", "Мадина К.", "Игорь Л."];
const COMPANIES = ["Safia", "Kapitalbank", "NBU", "Anorbank", "Click", "Beanberry", "Humo Arena", "Pepsi", "Red Bull", "ADM Global"];

// Prototype helpers (mulberry32 and a local-date ISO day).
const rng = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const isoDay = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const item = (p, z, frame, qty) => ({ code: p.k, title: p.t, image: p.img, w: z ? z.w : null, h: z ? z.h : null, price: z ? z.p : null, frame, qty });

function seed(products) {
  const now = Date.now();
  const rows = [
    ["new", 0.6, "Дилноза Каримова", "", "+998 90 123 45 67", "Сайт", [[0, 1, 0, 1]], "Хочу в спальню, стены бежевые. Можно сначала посмотреть макет?", null, []],
    ["new", 3, "Азиз Рахимов", "", "+998 93 555 12 09", "Instagram", [[5, 2, 1, 1]], "", null, []],
    ["new", 27, "Ойбек Назаров", "Safia", "+998 97 700 40 40", "Телефон", [[12, 0, 0, 6], [13, 0, 0, 6]], "Новый филиал на Чиланзаре — 12 картин в зал до конца месяца", null, []],
    ["contact", 30, "Екатерина Ли", "", "+998 99 812 33 10", "Сайт", [[20, 1, 2, 2]], "Подарок на новоселье", null, ["Перезвонили, ждёт фото стены"]],
    ["mockup", 50, "Тимур Юсупов", "", "+998 90 980 77 21", "Telegram", [[33, 0, 0, 1]], "С нашей семейной фотографией в стиле картины", 6, ["Отправили макет в Telegram"]],
    ["mockup", 75, "Шахноза Алиева", "Kapitalbank", "+998 71 200 15 15", "Телефон", [[40, 2, 1, 4]], "Переговорные, 3 этаж", 8, ["Согласуют макет с маркетингом"]],
    ["prod", 98, "Малика Турсунова", "", "+998 94 301 66 02", "Сайт", [[52, 1, 0, 1], [53, 1, 0, 1]], "", 4, ["Макет утверждён"]],
    ["prod", 130, "Шахзод Абдуллаев", "", "+998 91 444 08 18", "Instagram", [[61, 0, 0, 3]], "Детская, мальчик 5 лет", 3, []],
    ["ship", 170, "Ольга Пак", "", "+998 90 355 90 03", "Сайт", [[70, 1, 1, 1]], "Доставка после 18:00", 7, ["Курьер выехал"]],
    ["cancel", 330, "Руслан Ким", "", "+998 99 004 71 17", "Instagram", [[100, 1, 0, 1]], "", null, ["Передумал, вернётся весной"]],
  ];
  return rows.map(([status, h, name, company, phone, src, items, comment, dueIn, notes]) => {
    const at = now - h * H;
    return {
      at, name, company, phone, src, status, comment,
      due: dueIn ? isoDay(at + dueIn * D) : null,
      notes: notes.map((text, j) => ({ at: new Date(at + (j + 1) * 2 * H).toISOString(), text })),
      items: items.map(([pi, si, fi, q]) => {
        const p = products[pi % products.length];
        return item(p, p.s[si] || p.s[0], FR[fi], q);
      }),
    };
  });
}

function archive(products) {
  const r = rng(20261012);
  const out = [];
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const priced = products.filter((p) => p.s.some((z) => z.p != null));
  if (!priced.length) return out;
  const SEAS = [1.0, 1.25, 1.35, 1.0, 0.95, 0.8, 0.75, 0.8, 0.95, 1.05, 1.2, 1.6];
  for (let d = 730; d >= 2; d--) {
    const day = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - d);
    const wd = day.getDay();
    const lam = 0.95 * SEAS[day.getMonth()] * (0.6 + 0.4 * (1 - d / 730)) * (wd === 0 ? 0.6 : wd === 6 ? 1.15 : 1);
    let n = -1;
    let p = 1;
    const L = Math.exp(-lam);
    do {
      n++;
      p *= r();
    } while (p > L);
    for (let j = 0; j < n; j++) {
      const at = +day + (9 + r() * 11) * H;
      const b2b = r() < 0.06;
      const items = [];
      const cnt = r() < 0.18 ? 2 : 1;
      for (let m = 0; m < cnt; m++) {
        const pr = priced[Math.floor(Math.pow(r(), 1.8) * priced.length)];
        const zs = pr.s.filter((z) => z.p != null);
        const z = zs[Math.min(zs.length - 1, Math.floor(Math.pow(r(), 1.4) * zs.length))];
        items.push(item(pr, z, FR[r() < 0.7 ? 0 : r() < 0.6 ? 1 : 2], b2b ? 3 + Math.floor(r() * 8) : r() < 0.1 ? 2 : 1));
      }
      const sr = r();
      const ph = ["90", "91", "93", "94", "97", "99"][Math.floor(r() * 6)];
      out.push({
        at,
        name: NAMES[Math.floor(r() * NAMES.length)],
        company: b2b ? COMPANIES[Math.floor(r() * COMPANIES.length)] : "",
        phone: `+998 ${ph} ${100 + Math.floor(r() * 900)} ${10 + Math.floor(r() * 90)} ${10 + Math.floor(r() * 90)}`,
        src: b2b ? "Телефон" : sr < 0.42 ? "Сайт" : sr < 0.72 ? "Instagram" : sr < 0.86 ? "Telegram" : "Телефон",
        status: r() < 0.09 ? "cancel" : "done",
        comment: "", due: null, notes: [], items,
      });
    }
  }
  return out;
}

const db = await adminClient();
must(await db.from("requests").delete().lte("no", LAST_DEMO_NO));
console.log("demo requests deleted");

if (!process.argv.includes("--purge")) {
  // The prototype's product shape ({ k, t, img, s: [{ w, h, p }] }), in catalogue order, hidden included.
  const rows = must(await db.from("products").select("code, title, image, sizes").order("sort_order").order("code"));
  const products = rows.map((p) => ({ k: p.code, t: p.title, img: p.image, s: p.sizes.map((z) => ({ w: z.w, h: z.h, p: z.price })) }));

  const gen = [...archive(products), ...seed(products)].sort((a, b) => a.at - b.at);
  const requests = gen.map((q, i) => ({
    no: LAST_DEMO_NO - gen.length + 1 + i,
    created_at: new Date(q.at).toISOString(),
    name: q.name, phone: q.phone, company: q.company, source: q.src, status: q.status,
    comment: q.comment, due: q.due, notes: q.notes, items: q.items,
  }));
  for (let i = 0; i < requests.length; i += 200) must(await db.from("requests").insert(requests.slice(i, i + 200)));
  console.log(`demo requests: ${requests.length} (№ ${requests[0].no}–${LAST_DEMO_NO})`);
}
