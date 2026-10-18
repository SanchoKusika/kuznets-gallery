// Snapshot of the catalogue from Supabase (the source of truth), so rendering never touches the database:
//   src/data/catalog.json — code, title, sizes [{ w, h, price }], categories; visible works by sort_order, code
//
//   npm run export:data   (= node --env-file=../.env.local scripts/export-data.mjs)
// Reads through PostgREST with the publishable key — the same rows the site shows.

import fs from "node:fs";
import path from "node:path";

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (node --env-file=../.env.local …)");

async function select(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

const catalog = await select("products", "select=code,title,sizes,categories&hidden=eq.false&order=sort_order.asc,code.asc");

const dir = path.resolve(import.meta.dirname, "../src/data");
const write = (name, rows) => fs.writeFileSync(path.join(dir, name), JSON.stringify(rows, null, 2) + "\n");
write("catalog.json", catalog.map(({ code, title, sizes, categories }) => ({ code, title, sizes: sizes.map(({ w, h, price }) => ({ w, h, price })), categories })));
console.log(`catalog.json: ${catalog.length} works`);
