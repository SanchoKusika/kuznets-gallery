import "server-only";

import type { RequestItem } from "@/lib/request";
import { sessionDb } from "@/lib/supabase/session";
import type { Tables } from "@/lib/supabase/types";
import type { AdminData, AdminUser, Note, Product, Req, Review, Size } from "./model";

type Db = Awaited<ReturnType<typeof sessionDb>>;

/** The signed-in admin and a client acting as them, or null (no session, or not in `admins`). */
export async function getAdmin(): Promise<{ db: Db; admin: AdminUser } | null> {
  const db = await sessionDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from("admins").select("name, login").eq("id", user.id).maybeSingle();
  return data ? { db, admin: data } : null;
}

/** Same check for Server Actions: every action authorises itself. */
export async function requireAdmin(): Promise<Db> {
  const session = await getAdmin();
  if (!session) throw new Error("unauthorized");
  return session.db;
}

export const toProduct = (p: Tables<"products">): Product => ({
  code: p.code,
  title: p.title,
  description: p.description,
  image: p.image,
  sizes: p.sizes as Size[],
  customSizes: p.custom_sizes,
  categories: p.categories,
  hidden: p.hidden,
  sortOrder: p.sort_order,
});

export const fromProduct = (p: Product) => ({
  code: p.code,
  title: p.title,
  description: p.description,
  image: p.image,
  sizes: p.sizes,
  custom_sizes: p.customSizes,
  categories: p.categories,
  hidden: p.hidden,
  sort_order: p.sortOrder,
});

export const toRequest = (r: Tables<"requests">): Req => ({
  id: r.id,
  no: r.no,
  at: Date.parse(r.created_at),
  name: r.name,
  phone: r.phone,
  company: r.company,
  source: r.source,
  status: r.status,
  comment: r.comment,
  due: r.due ?? "",
  notes: (r.notes as { at: string; text: string }[]).map((n): Note => ({ at: Date.parse(n.at), text: n.text })),
  items: r.items as RequestItem[],
});

export const toReview = (r: Tables<"reviews">): Review => ({ id: r.id, name: r.name, text: r.text, hidden: r.hidden, sortOrder: r.sort_order });

/** All requests, newest first, in pages (the API returns at most 1000 rows per call). */
async function allRequests(db: Db) {
  const rows: Tables<"requests">[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false })
      .order("no", { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

/** Everything the panel works with; requests newest first (prototype `normalize`). */
export async function loadAdminData(db: Db): Promise<AdminData> {
  const [products, requests, reviews] = await Promise.all([
    db.from("products").select("*").order("sort_order").order("code"),
    allRequests(db),
    db.from("reviews").select("*").order("sort_order").order("created_at"),
  ]);
  if (products.error) throw products.error;
  if (reviews.error) throw reviews.error;
  return {
    products: products.data.map(toProduct),
    requests: requests.map(toRequest),
    reviews: reviews.data.map(toReview),
  };
}
