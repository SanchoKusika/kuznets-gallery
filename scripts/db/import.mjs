// Loads the prototype catalogue (design/data/products.json) and reviews into Supabase and copies
// every catalogue image from WordPress (kuznets.uz/wp-content/uploads) into the `artworks` bucket
// under the same path. Safe to re-run: existing products, reviews and images are kept.
//
//   node --env-file=.env.local --env-file=.env.scripts scripts/db/import.mjs            catalogue, reviews and images
//   node --env-file=.env.local --env-file=.env.scripts scripts/db/import.mjs --images   images only

import { readFileSync } from "node:fs";
import { adminClient, must } from "./client.mjs";

const WP_UPLOADS = "https://kuznets.uz/wp-content/uploads/";
const BUCKET = "artworks";
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

const products = JSON.parse(readFileSync(new URL("../../design/data/products.json", import.meta.url), "utf8"));

// WordPress listed the three framing options as products (KZ-073…075, no sizes); the site shows them
// in «Холст, багет или стекло», so they are not imported. Codes follow the position, so the rest keep theirs.
const NOT_ARTWORKS = new Set(["Холст на подрамнике", "Холст с подрамником + багет", "Бумага в рамке под стеклом"]);
const isArtwork = (p) => !NOT_ARTWORKS.has(p.t);

// The same picture was listed twice on WordPress (checked by file contents, not by names: same-name series
// like «Лама» or «Фраза» are different pictures). The copy is dropped and its directions join the work that stays.
const DUPLICATE_OF = {
  "KZ-167": "KZ-011", "KZ-147": "KZ-013", "KZ-158": "KZ-019", "KZ-164": "KZ-024", "KZ-161": "KZ-025", "KZ-132": "KZ-045",
  "KZ-144": "KZ-064", "KZ-170": "KZ-066", "KZ-120": "KZ-076", "KZ-145": "KZ-104", "KZ-163": "KZ-139",
};
// What the kept work takes from its copy: the real title and description («Новинка!» was a badge),
// the sizes that match the picture, a sharper photo.
const TAKE = { "KZ-139": ["title", "description", "sizes"], "KZ-045": ["sizes"], "KZ-064": ["sizes"], "KZ-104": ["image"] };

/** The catalogue as stored: prototype loadCatalog() (code KZ-<position>, order = position) without the rest above. */
function catalogue() {
  const rows = products
    .map((p, i) => ({
      code: p.k || `KZ-${String(i + 1).padStart(3, "0")}`,
      title: p.t ?? "",
      description: p.d ?? "",
      image: p.img ?? "",
      sizes: (p.s ?? []).map((z) => ({ w: z.w, h: z.h, price: z.p ?? null })),
      custom_sizes: p.x ?? [],
      categories: p.c ?? [],
      hidden: Boolean(p.h),
      sort_order: i,
    }))
    .filter((_, i) => isArtwork(products[i]));
  const byCode = new Map(rows.map((r) => [r.code, r]));
  for (const [copyCode, keptCode] of Object.entries(DUPLICATE_OF)) {
    const copy = byCode.get(copyCode);
    const kept = byCode.get(keptCode);
    kept.categories = [...new Set([...kept.categories, ...copy.categories])];
    for (const field of TAKE[keptCode] ?? []) kept[field] = copy[field];
  }
  return rows.filter((r) => !(r.code in DUPLICATE_OF));
}

// REVIEWS_DEF in design/Admin.dc.html (the site prototype shows the same nine).
const REVIEWS = [
  ["Arina Zemskova", "Реальное спасибо за реально крутые и креативные картины! Работаете чётко и качественно, подобрали к нашему интерьеру именно то, что мы хотели видеть."],
  ["Evgeniya Lyashko", "Настоящие профессионалы! Подобрали к нашему стилю лучше, чем мы себе это представляли. Качественно, быстро, ещё и с доставкой!"],
  ["Дилшод Алимханов", "Индивидуальный подход и высокое качество работы! Респект! Буду ещё заказывать!"],
  ["Sergey Shevchenko", "Спасибо за крутую картину в офис!"],
  ["Дилафруз Бегимкулова", "Молодцы! Индивидуальный подход и отличный сервис. Удачи вам."],
  ["Nataliya Bahramova", "Спасибо большое за работу! Всё очень супер! Ребята, вы молодцы!"],
  ["Максим и Алеся", "Спасибо вам за такую красоту!"],
  ["Max Nam", "Картина круче, чем на фото! Не жалею, что заказал именно у вас."],
  ["Alla Muxaramova", "Это здорово!"],
];

const db = await adminClient();
const rows = catalogue();

if (!process.argv.includes("--images")) {
  must(await db.from("products").upsert(rows, { onConflict: "code", ignoreDuplicates: true }));
  console.log(`products: ${rows.length}`);

  const { count } = await db.from("reviews").select("id", { count: "exact", head: true });
  if (!count) {
    must(await db.from("reviews").insert(REVIEWS.map(([name, text], i) => ({ name, text, sort_order: i }))));
    console.log(`reviews: ${REVIEWS.length}`);
  }
}

const paths = [...new Set(rows.map((r) => r.image).filter(Boolean))];
let copied = 0;
let kept = 0;
const failed = [];

async function copy(path) {
  const res = await fetch(WP_UPLOADS + path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  const ext = path.split(".").pop().toLowerCase();
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, body, { contentType: MIME[ext] ?? "image/jpeg", cacheControl: "31536000", upsert: false });
  if (!error) copied++;
  else if (error.statusCode === "409" || /exists/i.test(error.message)) kept++;
  else throw error;
}

// A few at a time: the WordPress host is small.
const queue = [...paths];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let path = queue.shift(); path; path = queue.shift()) {
      try {
        await copy(path);
      } catch (e) {
        failed.push(`${path}: ${e.message}`);
      }
    }
  }),
);

console.log(`images: ${copied} copied, ${kept} already there, ${failed.length} failed of ${paths.length}`);
if (failed.length) {
  console.log(failed.join("\n"));
  process.exitCode = 1;
}
