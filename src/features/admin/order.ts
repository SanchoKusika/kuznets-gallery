// Items of a request (заявка) made in the admin panel: lines from the catalogue, custom prints, a pasted table.

import type { RequestItem } from "@/lib/request";
import { baseName } from "./images";
import { FRAME_NAMES, standardSizes, type Product } from "./model";

/** Prices of standard sizes by "w×h": the most common price in the catalogue (the «Прайс» list). */
export type PriceList = Map<string, number>;

export const priceList = (products: Product[]): PriceList => new Map(standardSizes(products).map((z) => [`${z.w}×${z.h}`, z.mode]));

/** Price of a w×h print by the price list; null — not a standard size (priced by hand). */
export const stdPrice = (prices: PriceList, w: number | null, h: number | null) => (w && h ? (prices.get(`${w}×${h}`) ?? null) : null);

/** A line from the catalogue: its first size, canvas on a stretcher. */
export function fromProduct(p: Product, size?: { w: number; h: number }): RequestItem {
  const z = (size && p.sizes.find((x) => x.w === size.w && x.h === size.h)) || p.sizes[0];
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

/** Framing by a word of it: «багет», «стекло» / «рамка», «холст». */
function frameOf(s: string) {
  const t = s.toLowerCase();
  if (t.includes("багет")) return FRAME_NAMES[1];
  if (t.includes("стекл") || t.includes("рамк") || t.includes("бумаг")) return FRAME_NAMES[2];
  if (t.includes("холст") || t.includes("подрамн")) return FRAME_NAMES[0];
  return null;
}

const NUMBER = /^\d[\d\s ]*(?:сум|шт\.?)?$/i;

/**
 * Rows pasted from a spreadsheet (Excel, Google Sheets: cells split by tabs; «;» works too). In any order:
 * a code KZ-xxx (a catalogue line), a size 60×90, a framing word, a link (the original), numbers — under 1000 is
 * the quantity, from 1000 the price per piece; the first text is the title, the rest goes to the note.
 * A header row (only words) is skipped.
 */
export function parseTable(text: string, products: Product[], prices: PriceList): RequestItem[] {
  const byCode = new Map(products.map((p) => [p.code, p]));
  const items: RequestItem[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line
      .split(line.includes("\t") ? "\t" : ";")
      .map((c) => c.trim())
      .filter(Boolean);
    if (!cells.length) continue;
    let product: Product | undefined;
    let z: { w: number; h: number } | null = null;
    let frame: string | null = null;
    let original = "";
    let qty: number | null = null;
    let price: number | null = null;
    const words: string[] = [];
    for (const c of cells) {
      const code = c.toUpperCase().match(/^KZ-\d{3,}$/)?.[0];
      if (code && byCode.has(code)) product = byCode.get(code);
      else if (/^https?:\/\//i.test(c)) original = c.slice(0, 1000);
      else if (NUMBER.test(c)) {
        const n = +c.replace(/\D/g, "");
        if (n >= 1000) price ??= n;
        else if (n > 0) qty ??= n;
      } else if (!z && size(c) && c.replace(SIZE, "").trim().length < 3) z = size(c);
      else if (!frame && frameOf(c)) frame = frameOf(c);
      else words.push(c);
    }
    // Only words: a header («Название, Размер, Кол-во») or a stray line.
    if (!product && !z && qty == null && price == null) continue;
    const [title, ...rest] = words;
    const extra = { qty: Math.min(qty ?? 1, 9999), ...(frame && { frame }), ...(original && { original }), ...(rest.length && { note: rest.join(" · ").slice(0, 500) }) };
    if (product) {
      const it = fromProduct(product, z ?? undefined);
      // A size the work does not have: the pasted one, priced by hand or by the list.
      const own = z && (it.w !== z.w || it.h !== z.h) ? { ...z, price: stdPrice(prices, z.w, z.h) } : {};
      items.push({ ...it, ...own, ...(price != null && { price }), ...extra });
    } else items.push({ ...customItem(prices, { w: z?.w ?? null, h: z?.h ?? null }), ...(title && { title: title.slice(0, 200) }), ...(price != null && { price }), ...extra });
  }
  return items;
}
