// Loads flat photos of the paintings («KZ-001 — Экзотика.jpg», straight-on, no wall) into the `artworks`
// bucket as `flat/KZ-001.jpg` and sets `products.flat_image`. Used by «Примерьте размер» on the home page.
// Safe to re-run: files already in the bucket are kept (a new photo for a work goes in through the admin).
//
//   node --env-file=.env.local scripts/db/flat-images.mjs "<folder>"

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { adminClient, must } from "./client.mjs";

const BUCKET = "artworks";
const dir = process.argv[2];
if (!dir) throw new Error("Pass the folder with «KZ-xxx — Название.jpg» files");

const db = await adminClient();
const codes = new Set(must(await db.from("products").select("code")).map((p) => p.code));
const stored = new Set(must(await db.storage.from(BUCKET).list("flat", { limit: 1000 })).map((f) => f.name));

let uploaded = 0;
let linked = 0;
const unknown = [];
for (const file of readdirSync(dir).sort()) {
  const code = file.match(/^(KZ-\d{3,})\b.*\.jpe?g$/i)?.[1];
  if (!code) continue;
  if (!codes.has(code)) {
    unknown.push(file);
    continue;
  }
  const path = `flat/${code}.jpg`;
  if (!stored.has(`${code}.jpg`)) {
    const body = readFileSync(join(dir, file));
    must(await db.storage.from(BUCKET).upload(path, body, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false }));
    uploaded++;
  }
  must(await db.from("products").update({ flat_image: path }).eq("code", code).select("code"));
  linked++;
}

console.log(`uploaded ${uploaded}, linked ${linked}`);
if (unknown.length) console.log("no such work:", unknown.join(", "));
const missing = [...codes].filter((c) => !readdirSync(dir).some((f) => f.startsWith(`${c} `)));
if (missing.length) console.log("works without a flat photo:", missing.join(", "));
