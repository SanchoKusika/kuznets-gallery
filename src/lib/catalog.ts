import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { CategoryKey, FormatKey } from "@/content/site";
import { formatPrice } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { routes } from "@/lib/routes";
import { publicDb } from "@/lib/supabase/public";

/** Cache tag of everything read from the catalogue; the admin panel updates it after edits. */
export const CATALOG_TAG = "catalog";

/** A size of an artwork (`sizes` in the database is [{ w, h, price }]). */
export type ArtworkSize = { w: number; h: number; p: number | null };

export type Artwork = {
  /** Inventory code, e.g. "KZ-001". */
  code: string;
  /** URL segment, e.g. "kz-001". */
  slug: string;
  title: string;
  description: string;
  /** Image as stored in the catalogue (object key in storage or a URL); stored with requests. */
  image: string;
  /** Resolved image URL. */
  src: string;
  /** Straight-on photo of the painting alone (no wall), or null; «Примерьте размер» on the home page. */
  flatSrc: string | null;
  sizes: ArtworkSize[];
  /** Raw category list incl. "all" (used for filtering, as in the prototype). */
  tags: string[];
  categories: CategoryKey[];
  minPrice: number | null;
  format: FormatKey;
};

export const formatOf = (s?: { w: number; h: number }): FormatKey =>
  !s ? "sq" : s.w === s.h ? "sq" : s.w > s.h ? "h" : "v";

/** Visible catalogue in the admin's order — same mapping as the prototype's `loadCatalog()`. */
export async function getCatalog(): Promise<Artwork[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");

  const { data, error } = await publicDb()
    .from("products")
    .select("code, title, description, image, flat_image, sizes, custom_sizes, categories")
    .order("sort_order")
    .order("code");
  if (error) throw error;

  return data.map((p): Artwork => {
    const standard = (p.sizes as { w: number; h: number; price: number | null }[]).map((z) => ({ w: z.w, h: z.h, p: z.price }));
    const extra = p.custom_sizes.flatMap((label): ArtworkSize[] => {
      const m = label.match(/(\d+)\s*\/\s*(\d+)/);
      return m ? [{ w: Number(m[1]), h: Number(m[2]), p: null }] : [];
    });
    const sizes = [...standard, ...extra];
    const prices = sizes.map((s) => s.p).filter((v): v is number => Boolean(v));
    return {
      code: p.code,
      slug: p.code.toLowerCase(),
      title: p.title,
      description: p.description,
      image: p.image,
      src: imageUrl(p.image),
      flatSrc: p.flat_image ? imageUrl(p.flat_image) : null,
      sizes,
      tags: p.categories,
      categories: p.categories.filter((k): k is CategoryKey => k !== "all"),
      minPrice: prices.length ? Math.min(...prices) : null,
      format: formatOf(sizes[0]),
    };
  });
}

/** Everything a card, list row or related tile needs (prototype `card()`). Plain data for client components. */
export type ArtworkCard = {
  code: string;
  href: string;
  title: string;
  description: string;
  src: string;
  format: FormatKey;
  minPrice: number | null;
  /** "от 90 000 сум" or "Цена по запросу". */
  from: string;
  /** "25×25 — 70×100 см", "50×70 см" or "Размер на заказ". */
  range: string;
  /** "25/25 · 50/70 · 70/100 см". */
  sizesText: string;
};

export function toCard(p: Artwork): ArtworkCard {
  const first = p.sizes[0];
  const last = p.sizes[p.sizes.length - 1];
  const wh = (s: ArtworkSize) => `${s.w}×${s.h}`;
  return {
    code: p.code,
    href: routes.work(p.slug),
    title: p.title,
    description: p.description,
    src: p.src,
    format: p.format,
    minPrice: p.minPrice,
    from: p.minPrice ? `от ${formatPrice(p.minPrice)}` : "Цена по запросу",
    range: !first ? "Размер на заказ" : p.sizes.length > 1 ? `${wh(first)} — ${wh(last)} см` : `${wh(first)} см`,
    sizesText: p.sizes.map((s) => `${s.w}/${s.h}`).join(" · ") + (p.sizes.length ? " см" : ""),
  };
}

/** Works of a category; "all" means the whole catalogue (not the catalogue's `all` tag). */
export const inCategory = (items: Artwork[], category: CategoryKey | "all") =>
  category === "all" ? items : items.filter((p) => p.tags.includes(category));

/**
 * Price list for «Покупателям»: the cheapest price of every standard size in the catalogue,
 * sorted by price, then width (prototype `priceMap` / `priceTable`).
 */
export async function getPriceTable() {
  const cheapest = new Map<string, ArtworkSize & { p: number }>();
  for (const p of await getCatalog()) {
    for (const z of p.sizes) {
      if (!z.p) continue;
      const key = `${z.w}/${z.h}`;
      const known = cheapest.get(key);
      if (!known || known.p > z.p) cheapest.set(key, { ...z, p: z.p });
    }
  }
  const sizes = [...cheapest.values()].sort((a, z) => a.p - z.p || a.w - z.w);
  return {
    rows: sizes.map((z) => ({ size: `${z.w} / ${z.h}`, format: formatOf(z), price: `от ${formatPrice(z.p)}` })),
    min: sizes[0]?.p ?? 90000,
    max: sizes[sizes.length - 1]?.p ?? null,
  };
}
