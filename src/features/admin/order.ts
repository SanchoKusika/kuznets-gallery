// Items of a request (заявка) made in the admin panel: lines from the catalogue and custom prints.

import type { RequestItem } from "@/lib/request";
import { baseName } from "./images";
import { FRAME_NAMES, standardSizes, type Product } from "./model";

/** Prices of standard sizes by "w×h": the most common price in the catalogue (the «Прайс» list). */
export type PriceList = Map<string, number>;

export const priceList = (products: Product[]): PriceList => new Map(standardSizes(products).map((z) => [`${z.w}×${z.h}`, z.mode]));

/** Price of a w×h print by the price list; null — not a standard size (priced by hand). */
export const stdPrice = (prices: PriceList, w: number | null, h: number | null) => (w && h ? (prices.get(`${w}×${h}`) ?? null) : null);

/** A line from the catalogue: its first size, canvas on a stretcher. */
export function fromProduct(p: Product): RequestItem {
  const z = p.sizes[0];
  return { code: p.code, title: p.title, image: p.image, w: z?.w ?? null, h: z?.h ?? null, price: z?.price ?? null, frame: FRAME_NAMES[0], qty: 1 };
}

export const CUSTOM_TITLE = "Свой принт";

/** A short id for a line (see RequestItem.id). */
export const lineId = () => crypto.randomUUID().slice(0, 8);

/** A custom print: no code; the price comes from the price list when the size is a standard one. */
export function customItem(prices: PriceList, fields: Partial<RequestItem> = {}): RequestItem {
  const w = fields.w ?? null;
  const h = fields.h ?? null;
  return { code: "", title: CUSTOM_TITLE, image: "", w, h, price: stdPrice(prices, w, h), frame: FRAME_NAMES[0], qty: 1, ...fields };
}

/**
 * A new size of a custom print: the price follows the price list while it is the list's price (or none),
 * a price entered by hand stays.
 */
export function resize(prices: PriceList, it: RequestItem, w: number | null, h: number | null): Partial<RequestItem> {
  const auto = it.price == null || it.price === stdPrice(prices, it.w, it.h);
  const next = stdPrice(prices, w, h);
  return { w, h, ...(auto && { price: next }) };
}

/** "60x90", "60 × 90 см", "60х90" (Cyrillic х), "60*90". */
const SIZE = /(\d{2,4})\s*[xх×*]\s*(\d{2,4})(?:\s*см)?/i;

const size = (s: string) => {
  const m = s.match(SIZE);
  return m ? { w: +m[1], h: +m[2] } : null;
};

/** A file of a custom print: "Ferma_60x90.jpg" → title "Ferma", size 60×90. */
export function fromFileName(name: string) {
  const base = baseName(name);
  const z = size(base);
  const title = base
    .replace(SIZE, " ")
    .replace(/[_\s]+/g, " ")
    .replace(/^[\s\-.]+|[\s\-.]+$/g, "")
    .trim();
  return { title: title ? (title.charAt(0).toUpperCase() + title.slice(1)).slice(0, 200) : CUSTOM_TITLE, w: z?.w ?? null, h: z?.h ?? null };
}
