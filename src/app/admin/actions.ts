"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { fromProduct, requireAdmin, toRequest, toReview } from "@/features/admin/server";
import { SOURCES, STATUSES, type Product, type Req, type ReqPatch, type Review } from "@/features/admin/model";
import { CATALOG_TAG } from "@/lib/catalog";
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

/** New sizes of several products at once (price list changes and their undo); only existing rows change. */
export async function saveSizes(list: { code: string; sizes: Product["sizes"] }[]) {
  const db = await requireAdmin();
  const rows = z.array(ProductSchema.pick({ code: true, sizes: true })).max(1000).parse(list);
  if (rows.length) check(await db.rpc("set_product_sizes", { p_rows: rows }));
  updateTag(CATALOG_TAG);
}

/** Signed URL the browser uploads an artwork image to; returns the object key for `products.image`. */
export async function createImageUpload(fileName: string): Promise<{ path: string; url: string }> {
  const db = await requireAdmin();
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
