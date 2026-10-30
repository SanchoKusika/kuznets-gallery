"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { fromProduct, requireAdmin, toRequest, toReview } from "@/features/admin/server";
import { SOURCES, STATUSES, type Product, type Req, type ReqPatch, type Review } from "@/features/admin/model";
import { CATALOG_TAG } from "@/lib/catalog";
import { bucketKey, VARIANT_DIR, VARIANT_WIDTHS, variantKey } from "@/lib/images";
import { REVIEWS_TAG } from "@/lib/reviews";
import { ADMIN_MARKER_COOKIE, AUTH_COOKIE_OPTIONS, REMEMBER_COOKIE } from "@/lib/supabase/cookies";
import { sessionDb } from "@/lib/supabase/session";

// Every action is a public endpoint: it re-checks the admin session (requireAdmin) and validates input.

const text = (max: number) => z.string().max(max);
const Size = z.object({ w: z.number().int().positive().max(10000), h: z.number().int().positive().max(10000), price: z.number().int().nonnegative().nullable() });
const Item = z.object({
  code: text(20),
  title: text(200),
  image: text(500),
  w: z.number().int().positive().nullable(),
  h: z.number().int().positive().nullable(),
  price: z.number().int().nonnegative().nullable(),
  frame: text(100),
  framePrice: z.number().int().nonnegative().max(1e9).nullable().optional(),
  qty: z.number().int().min(1).max(999),
});
const Note = z.object({ at: z.number(), text: text(2000) });
const ProductSchema = z.object({
  code: z.string().regex(/^KZ-\d{3,}$/),
  title: text(200),
  description: text(2000),
  image: text(500),
  flatImage: text(500),
  sizes: z.array(Size).max(50),
  customSizes: z.array(text(50)).max(20),
  categories: z.array(z.enum(["home", "kids", "office", "public", "all"])),
  hidden: z.boolean(),
  sortOrder: z.number().int(),
}) satisfies z.ZodType<Product>;
const PatchSchema = z
  .object({
    name: text(100),
    phone: text(40),
    company: text(200),
    source: z.enum(SOURCES as [Req["source"], ...Req["source"][]]),
    status: z.enum(STATUSES.map((s) => s.k) as [Req["status"], ...Req["status"][]]),
    comment: text(2000),
    due: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    notes: z.array(Note).max(200),
    items: z.array(Item).max(100),
  })
  .partial() satisfies z.ZodType<ReqPatch>;
const ReviewSchema = z.object({ id: z.uuid(), name: text(100), text: text(1000), hidden: z.boolean(), sortOrder: z.number().int() }) satisfies z.ZodType<Review>;
const Codes = z.array(z.string().max(20)).max(1000);

/** Throws a Supabase error. */
const check = ({ error }: { error: unknown }) => {
  if (error) throw error;
};
/** Throws a Supabase error, returns the selected row(s). */
const must = <T>({ data, error }: { data: T; error: unknown }): NonNullable<T> => {
  if (error) throw error;
  if (data == null) throw new Error("no data");
  return data;
};

const toRow = (p: ReqPatch) => {
  const { notes, due, ...rest } = p;
  return {
    ...rest,
    ...(due !== undefined && { due: due || null }),
    ...(notes && { notes: notes.map((n) => ({ at: new Date(n.at).toISOString(), text: n.text })) }),
  };
};

// —— Auth

/** Sign in with the admin's login (or e-mail); errors are the prototype's texts. */
export async function signIn(login: string, password: string, remember: boolean): Promise<{ error?: string }> {
  if (!login.trim()) return { error: "Укажите логин" };
  const store = await cookies();
  const lifetime = { ...AUTH_COOKIE_OPTIONS, ...(remember && { maxAge: 400 * 24 * 3600 }) };
  store.set(REMEMBER_COOKIE, remember ? "1" : "0", lifetime);
  const db = await sessionDb(remember);
  const { data: email } = await db.rpc("admin_email", { p_login: login.slice(0, 100) });
  if (!email) return { error: "Неверный пароль" };
  const { data, error } = await db.auth.signInWithPassword({ email, password: password.slice(0, 200) });
  if (error) return { error: error.status === 429 ? "Слишком много попыток, попробуйте позже" : "Неверный пароль" };
  const { data: admin } = await db.from("admins").select("id").eq("id", data.user.id).maybeSingle();
  if (!admin) {
    await db.auth.signOut();
    return { error: "Неверный пароль" };
  }
  store.set(ADMIN_MARKER_COOKIE, "1", { ...lifetime, httpOnly: false });
  return {};
}

export async function signOut() {
  const db = await sessionDb();
  await db.auth.signOut();
  const store = await cookies();
  store.delete(REMEMBER_COOKIE);
  store.delete(ADMIN_MARKER_COOKIE);
}

// —— Requests (no site cache to update: requests never reach the public pages)

export async function createRequest(): Promise<Req> {
  const db = await requireAdmin();
  const row = must(await db.from("requests").insert({ name: "", phone: "+998 ", source: "Телефон", status: "new" }).select().single());
  return toRequest(row);
}

export async function updateRequest(id: string, patch: ReqPatch) {
  const db = await requireAdmin();
  check(await db.from("requests").update(toRow(PatchSchema.parse(patch))).eq("id", z.uuid().parse(id)));
}

export async function deleteRequest(id: string) {
  const db = await requireAdmin();
  check(await db.from("requests").delete().eq("id", z.uuid().parse(id)));
}

/** Undo of a delete: the same id, number and date. */
export async function restoreRequest(r: Req) {
  const db = await requireAdmin();
  const { id, no, at, ...fields } = r;
  const patch = PatchSchema.parse(fields);
  check(
    await db.from("requests").insert({
      ...toRow(patch),
      id: z.uuid().parse(id),
      no: z.number().int().positive().parse(no),
      created_at: new Date(z.number().parse(at)).toISOString(),
    }),
  );
}

// —— Catalogue (the site's pages are rebuilt from the `catalog` tag)

export async function saveProduct(p: Product) {
  const db = await requireAdmin();
  check(await db.from("products").upsert(fromProduct(ProductSchema.parse(p))));
  updateTag(CATALOG_TAG);
}

/** Whole products: undo of a delete or of a price change. */
export async function restoreProducts(list: Product[]) {
  const db = await requireAdmin();
  check(await db.from("products").upsert(z.array(ProductSchema).max(1000).parse(list).map(fromProduct)));
  updateTag(CATALOG_TAG);
}

export async function deleteProducts(codes: string[]) {
  const db = await requireAdmin();
  check(await db.from("products").delete().in("code", Codes.parse(codes)));
  updateTag(CATALOG_TAG);
}

export async function setProductsHidden(codes: string[], hidden: boolean) {
  const db = await requireAdmin();
  check(await db.from("products").update({ hidden: z.boolean().parse(hidden) }).in("code", Codes.parse(codes)));
  updateTag(CATALOG_TAG);
}

/**
 * Catalogue order (drag-and-drop, «Наверх» and their undo): only `sort_order` of existing products changes, so edits
 * made elsewhere (another tab, right in Supabase) are not overwritten. One update per product, a few at a time.
 */
export async function saveOrder(list: { code: string; sortOrder: number }[]) {
  const db = await requireAdmin();
  const rows = z.array(z.object({ code: z.string().max(20), sortOrder: z.number().int() })).max(1000).parse(list);
  for (let i = 0; i < rows.length; i += 20) {
    const results = await Promise.all(rows.slice(i, i + 20).map((r) => db.from("products").update({ sort_order: r.sortOrder }).eq("code", r.code)));
    results.forEach(check);
  }
  updateTag(CATALOG_TAG);
}

/** New sizes of several products at once (price list changes and their undo); only existing rows change. */
export async function saveSizes(list: { code: string; sizes: Product["sizes"] }[]) {
  const db = await requireAdmin();
  const rows = z.array(ProductSchema.pick({ code: true, sizes: true })).max(1000).parse(list);
  if (rows.length) check(await db.rpc("set_product_sizes", { p_rows: rows }));
  updateTag(CATALOG_TAG);
}

/** «Обновить сайт»: the site's pages are rebuilt from the database, e.g. after edits made right in Supabase. */
export async function refreshSite() {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  updateTag(REVIEWS_TAG);
}

/** Signed URL the browser uploads an artwork image to; returns the object key for `products.image`. */
export async function createImageUpload(fileName: string): Promise<{ path: string; url: string }> {
  const db = await requireAdmin();
  // The panel uploads WebP (features/admin/images.ts); PNG comes from a browser that cannot encode it.
  const ext = fileName.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1];
  if (!ext) throw new Error("JPG, PNG или WebP");
  const base =
    fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .toUpperCase() || "KARTINA";
  const now = new Date();
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${base}-${crypto.randomUUID().slice(0, 6)}.${ext === "jpeg" ? "jpg" : ext}`;
  const data = must(await db.storage.from("artworks").createSignedUploadUrl(path));
  return { path: data.path, url: data.signedUrl };
}

/** Signed URLs (overwriting) for the WebP copies of a bucket image (lib/images.ts), made in the browser. */
export async function createVariantUploads(key: string): Promise<{ width: number; url: string }[]> {
  const db = await requireAdmin();
  const k = z
    .string()
    .max(500)
    .regex(/^(?!_v\/)(?!.*\.\.)[\w\-./]+\.(jpe?g|png|webp)$/i)
    .parse(key);
  const bucket = db.storage.from("artworks");
  return Promise.all(VARIANT_WIDTHS.map(async (width) => ({ width, url: must(await bucket.createSignedUploadUrl(variantKey(k, width), { upsert: true })).signedUrl })));
}

/** A file stays this long after it was first seen unreferenced: a card still open, a deleted work «Вернуть» may bring back. */
const KEEP_MS = 24 * 3600 * 1000;
const PAGE = 1000;

/** Every row of a select (PostgREST returns at most 1000 at a time). */
async function selectAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = must(await query(from, from + PAGE - 1));
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

/**
 * Storage keeps only files a work or a request refers to, with their copies. A file is deleted once it has been
 * unreferenced for a day (replaced photos, uploads of cards closed unsaved, deleted works): `seen` — when the
 * panel first saw each unreferenced file, kept in the admin's browser — comes in, the updated one goes back.
 * Runs once per admin session.
 */
export async function sweepStorage(seen: Record<string, number>): Promise<{ deleted: number; seen: Record<string, number> }> {
  const db = await requireAdmin();
  const since = z.record(z.string().max(500), z.number()).parse(seen);
  const bucket = db.storage.from("artworks");
  const [products, requests] = await Promise.all([
    selectAll((from, to) => db.from("products").select("image, flat_image").order("code").range(from, to)),
    selectAll((from, to) => db.from("requests").select("items").order("id").range(from, to)),
  ]);
  const used = new Set(
    [...products.flatMap((p) => [p.image, p.flat_image]), ...requests.flatMap((r) => (r.items as { image?: string }[]).map((i) => i.image))]
      .map((path) => (path ? bucketKey(path) : null))
      .filter((key): key is string => !!key),
  );
  const stems = new Set([...used].map((key) => key.replace(/\.[^./]+$/, "")));
  const files = await listBucket(bucket, "");
  const unused = files.filter((f) =>
    f.key.startsWith(VARIANT_DIR) ? !stems.has(f.key.slice(VARIANT_DIR.length).replace(/^\d+\//, "").replace(/\.webp$/, "")) : !used.has(f.key),
  );
  const now = Date.now();
  const before = now - KEEP_MS;
  // Unreferenced for a day by the panel's own record, and uploaded over a day ago (no upload time: kept).
  const stale = unused.filter((f) => (since[f.key] ?? now) <= before && Date.parse(f.at) <= before);
  // A mistake here would empty the catalogue's pictures: refuse anything that looks like most of the bucket.
  if (!used.size || stale.length > Math.max(50, files.length * 0.25)) throw new Error(`sweep refused: ${stale.length} of ${files.length}`);
  for (let i = 0; i < stale.length; i += 100) check(await bucket.remove(stale.slice(i, i + 100).map((f) => f.key)));
  const gone = new Set(stale.map((f) => f.key));
  return { deleted: stale.length, seen: Object.fromEntries(unused.filter((f) => !gone.has(f.key)).map((f) => [f.key, since[f.key] ?? now])) };
}

type Bucket = ReturnType<Awaited<ReturnType<typeof requireAdmin>>["storage"]["from"]>;

/** Every file under `prefix` with its upload time (Storage lists one folder at a time: subfolders go in parallel). */
async function listBucket(bucket: Bucket, prefix: string): Promise<{ key: string; at: string }[]> {
  const files: { key: string; at: string }[] = [];
  const folders: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = must(await bucket.list(prefix, { limit: PAGE, offset }));
    for (const f of page) {
      const key = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.id == null) folders.push(key);
      else files.push({ key, at: f.created_at ?? "" });
    }
    if (page.length < PAGE) break;
  }
  for (const nested of await Promise.all(folders.map((key) => listBucket(bucket, key)))) files.push(...nested);
  return files;
}

// —— Reviews (the home page slider is rebuilt from the `reviews` tag)

export async function createReview(sortOrder: number): Promise<Review> {
  const db = await requireAdmin();
  const row = must(await db.from("reviews").insert({ sort_order: z.number().int().parse(sortOrder) }).select().single());
  updateTag(REVIEWS_TAG);
  return toReview(row);
}

/** Saves reviews as given (text edits, visibility, order, undo of a delete). */
export async function saveReviews(list: Review[]) {
  const db = await requireAdmin();
  const rows = z.array(ReviewSchema).max(200).parse(list).map((r) => ({ id: r.id, name: r.name, text: r.text, hidden: r.hidden, sort_order: r.sortOrder }));
  if (rows.length) check(await db.from("reviews").upsert(rows));
  updateTag(REVIEWS_TAG);
}

export async function deleteReview(id: string) {
  const db = await requireAdmin();
  check(await db.from("reviews").delete().eq("id", z.uuid().parse(id)));
  updateTag(REVIEWS_TAG);
}
