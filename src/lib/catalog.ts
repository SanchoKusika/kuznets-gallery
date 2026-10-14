import "server-only";

import raw from "@/data/products.json";
import type { CategoryKey, FormatKey } from "@/content/site";
import { imageUrl } from "@/lib/images";

type RawSize = { w: number; h: number; p: number | null };
type RawProduct = {
  t: string;
  d?: string;
  img: string;
  s?: RawSize[];
  x?: string[];
  c?: string[];
  k?: string;
  h?: boolean;
};

export type ArtworkSize = { w: number; h: number; p: number | null };

export type Artwork = {
  /** Position in the source catalogue (prototype `id`). */
  id: number;
  /** Inventory code, e.g. "KZ-001". */
  code: string;
  /** URL segment, e.g. "kz-001". */
  slug: string;
  title: string;
  description: string;
  src: string;
  sizes: ArtworkSize[];
  /** Raw category list incl. "all" (used for filtering, as in the prototype). */
  tags: string[];
  categories: CategoryKey[];
  minPrice: number | null;
  format: FormatKey;
};

export const formatOf = (s?: { w: number; h: number }): FormatKey =>
  !s ? "sq" : s.w === s.h ? "sq" : s.w > s.h ? "h" : "v";

let cache: Artwork[] | null = null;

/** Visible catalogue — same mapping as the prototype's `loadCatalog()`. */
export function getCatalog(): Artwork[] {
  if (cache) return cache;
  cache = (raw as RawProduct[])
    .map((p, i): Artwork | null => {
      if (p.h) return null;
      const extra = (p.x ?? []).flatMap((label): ArtworkSize[] => {
        const m = label.match(/(\d+)\s*\/\s*(\d+)/);
        return m ? [{ w: Number(m[1]), h: Number(m[2]), p: null }] : [];
      });
      const sizes: ArtworkSize[] = [...(p.s ?? []), ...extra];
      const prices = sizes.map((s) => s.p).filter((v): v is number => Boolean(v));
      const tags = p.c ?? [];
      const code = p.k || `KZ-${String(i + 1).padStart(3, "0")}`;
      return {
        id: i,
        code,
        slug: code.toLowerCase(),
        title: p.t,
        description: p.d ?? "",
        src: imageUrl(p.img),
        sizes,
        tags,
        categories: tags.filter((k): k is CategoryKey => k !== "all"),
        minPrice: prices.length ? Math.min(...prices) : null,
        format: formatOf(sizes[0]),
      };
    })
    .filter((p): p is Artwork => p !== null);
  return cache;
}
