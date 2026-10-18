import artJson from "./art.json";
import catalogJson from "./catalog.json";

export type Art = { code: string; title: string; file: string; w: number; h: number; excluded: boolean };
export type CatalogItem = { code: string; title: string; sizes: { w: number; h: number; price: number | null }[]; categories: string[] };

export const ART: Art[] = artJson;
export const CATALOG: CatalogItem[] = catalogJson;

const byCode = new Map(ART.map((a) => [a.code, a]));

/** Artwork by code; throws on an unknown or excluded work (brief 3.1). */
export function art(code: string): Art {
  const a = byCode.get(code);
  if (!a) throw new Error(`Unknown artwork ${code}`);
  if (a.excluded) throw new Error(`${code} «${a.title}» is excluded from the videos`);
  return a;
}

/** Works allowed in the videos, in catalogue order. */
export const ALLOWED: Art[] = CATALOG.map((c) => byCode.get(c.code)).filter((a): a is Art => !!a && !a.excluded);

/** Number of works on the site (counter in «{n} авторских работ»). */
export const WORKS_COUNT = CATALOG.length;

/** Cheapest size of a work: { w, h, price } (museum labels, «от …»). */
export function cheapest(code: string) {
  const item = CATALOG.find((c) => c.code === code);
  if (!item) throw new Error(`${code} is not in catalog.json`);
  const priced = item.sizes.filter((s) => s.price != null) as { w: number; h: number; price: number }[];
  return priced.sort((a, b) => a.price - b.price)[0];
}
