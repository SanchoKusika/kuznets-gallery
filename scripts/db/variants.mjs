// Makes the WebP copies the site's image loader serves (VARIANT_WIDTHS in src/lib/images.ts): for every image in
// the `artworks` bucket, `_v/<width>/<key without extension>.webp` 256, 640, 1200 and 2048 px wide (never enlarged),
// and for an image that is not a JPEG or PNG, `_v/og/<key without extension>.jpg` 1200 px wide for link previews.
// Copies already in the bucket are kept, so it is safe to re-run; new uploads get theirs in the admin panel.
//
//   node --env-file=.env.local scripts/db/variants.mjs

import sharp from "sharp";
import { adminClient, must } from "./client.mjs";

const BUCKET = "artworks";
const WIDTHS = [256, 640, 1200, 2048];
const DIR = "_v/";
const QUALITY = 80;
const PARALLEL = 6;

const OG_WIDTH = 1200;
const OG_QUALITY = 82;

const variantKey = (key, width) => `${DIR}${width}/${key.replace(/\.[^./]+$/, "")}.webp`;
const ogKey = (key) => `${DIR}og/${key.replace(/\.[^./]+$/, "")}.jpg`;
const needsOg = (key) => !/\.(jpe?g|png)$/i.test(key);

const db = await adminClient();
const bucket = db.storage.from(BUCKET);

/** Every object key under `prefix` (folders are listed one by one). */
async function list(prefix) {
  const keys = [];
  for (let offset = 0; ; offset += 1000) {
    const page = must(await bucket.list(prefix, { limit: 1000, offset }));
    for (const f of page) {
      const key = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.id == null) keys.push(...(await list(key)));
      else keys.push(key);
    }
    if (page.length < 1000) return keys;
  }
}

const all = await list("");
const have = new Set(all.filter((k) => k.startsWith(DIR)));
const images = all.filter((k) => !k.startsWith(DIR) && /\.(jpe?g|png|webp)$/i.test(k));

let made = 0;
let done = 0;
const failed = [];
async function prepare(key) {
  const missing = WIDTHS.filter((w) => !have.has(variantKey(key, w)));
  const og = needsOg(key) && !have.has(ogKey(key));
  if (!missing.length && !og) return;
  try {
    const source = Buffer.from(await must(await bucket.download(key)).arrayBuffer());
    for (const w of missing) {
      const body = await sharp(source).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
      must(await bucket.upload(variantKey(key, w), body, { contentType: "image/webp", cacheControl: "31536000", upsert: false }));
      made++;
    }
    if (og) {
      const body = await sharp(source).rotate().resize({ width: OG_WIDTH, withoutEnlargement: true }).jpeg({ quality: OG_QUALITY, mozjpeg: true }).toBuffer();
      must(await bucket.upload(ogKey(key), body, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false }));
      made++;
    }
  } catch (e) {
    failed.push(`${key}: ${e.message ?? e}`);
  }
}

const queue = [...images];
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    for (let key = queue.shift(); key; key = queue.shift()) {
      await prepare(key);
      if (++done % 25 === 0) console.log(`${done}/${images.length}`);
    }
  }),
);

console.log(`images ${images.length}, copies made ${made}`);
if (failed.length) console.log("failed:\n" + failed.join("\n"));
