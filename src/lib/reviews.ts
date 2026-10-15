import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";

/** Cache tag of the reviews shown on the site; the admin panel updates it after edits. */
export const REVIEWS_TAG = "reviews";

export type Review = { n: string; q: string };

/** Visible reviews in the admin's order (it is the order of the slider). */
export async function getReviews(): Promise<Review[]> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("max");

  const { data, error } = await publicDb().from("reviews").select("name, text").order("sort_order").order("created_at");
  if (error) throw error;
  return data.map((r) => ({ n: r.name, q: r.text }));
}
