// Admin panel data model and reference lists (prototype constants in design/Admin.dc.html).

import type { CategoryKey } from "@/content/site";
import { FRAMES } from "@/content/site";
import type { RequestItem } from "@/lib/request";
import type { Enums } from "@/lib/supabase/types";

export type Status = Enums<"request_status">;
export type Source = Enums<"request_source">;

export const STATUSES: readonly { k: Status; n: string }[] = [
  { k: "new", n: "Новая" },
  { k: "contact", n: "Связались" },
  { k: "mockup", n: "Макет" },
  { k: "prod", n: "Производство" },
  { k: "ship", n: "Доставка" },
  { k: "done", n: "Выполнена" },
  { k: "cancel", n: "Отменена" },
];
export const STATUS_NAME = Object.fromEntries(STATUSES.map((s) => [s.k, s.n])) as Record<Status, string>;
/** Statuses that count as "в работе". */
export const ACTIVE: readonly Status[] = ["contact", "mockup", "prod", "ship"];
export const SOURCES: readonly Source[] = ["Сайт", "Instagram", "Telegram", "Телефон"];
export const FRAME_NAMES: readonly string[] = FRAMES.map((f) => f.n);

/** Directions with the admin's names and short labels (prototype `CATS` of the admin). */
export const ADMIN_CATS: readonly { k: CategoryKey; n: string; s: string }[] = [
  { k: "home", n: "Для дома", s: "Дом" },
  { k: "kids", n: "Для детской", s: "Детская" },
  { k: "office", n: "Для офиса", s: "Офис" },
  { k: "public", n: "Общественные места", s: "Общ. места" },
];

export type Size = { w: number; h: number; price: number | null };

export type Product = {
  code: string;
  title: string;
  description: string;
  /** Object key in the `artworks` bucket or a URL. */
  image: string;
  /** Straight-on photo of the painting alone, for «Примерьте размер»; key or URL, "" — none. */
  flatImage: string;
  sizes: Size[];
  /** "Размеры по запросу", e.g. "100/140 см". */
  customSizes: string[];
  /** Directions plus the catalogue's service tag `all`. */
  categories: string[];
  hidden: boolean;
  sortOrder: number;
};

export type Note = { at: number; text: string };

export type Req = {
  id: string;
  no: number;
  /** Created at, ms. */
  at: number;
  name: string;
  phone: string;
  company: string;
  source: Source;
  status: Status;
  comment: string;
  /** Due date "YYYY-MM-DD" or "". */
  due: string;
  notes: Note[];
  items: RequestItem[];
};

/** Fields of a request the admin edits. */
export type ReqPatch = Partial<Omit<Req, "id" | "no" | "at">>;

export type Review = { id: string; name: string; text: string; hidden: boolean; sortOrder: number };

export type AdminUser = { name: string; login: string };

export type AdminData = { products: Product[]; requests: Req[]; reviews: Review[] };

/** The framing is priced separately (baget, glass): anything but the canvas on a stretcher, which is in the price. */
export const separateFrame = (i: RequestItem) => FRAME_NAMES.includes(i.frame) && i.frame !== FRAME_NAMES[0];

/** A line's sum: the size's price plus the framing the manager entered, times the quantity; null — priced on request. */
export const lineTotal = (i: RequestItem) => (i.price == null ? null : (i.price + (separateFrame(i) ? (i.framePrice ?? 0) : 0)) * (i.qty || 1));

/**
 * Total of a request (prototype `reqTotal`, plus the framing): `q` — some lines are priced on request,
 * `f` — some framing is priced separately and not entered yet.
 */
export function reqTotal(r: Req) {
  let t = 0;
  let q = false;
  let f = false;
  for (const i of r.items) {
    const line = lineTotal(i);
    if (line == null) q = true;
    else t += line;
    if (separateFrame(i) && i.framePrice == null) f = true;
  }
  return { t, q, f };
}

/** Lowest standard price of a product (prototype `minP`). */
export function minPrice(p: Product) {
  const a = p.sizes.map((z) => z.price).filter((v): v is number => v != null);
  return a.length ? Math.min(...a) : null;
}

export const digits = (s: string) => s.replace(/\D/g, "");

/** "Ферма × 2", "Ферма + ещё 1", "Состав не указан" (prototype `what`). */
export function itemsSummary(r: Req) {
  if (!r.items.length) return "Состав не указан";
  const first = r.items[0];
  return first.title + (r.items.length > 1 ? ` + ещё ${r.items.length - 1}` : "") + (r.items.length === 1 && first.qty > 1 ? ` × ${first.qty}` : "");
}

/** Dot colour of a status: accent for new, ink-4 for closed, ink otherwise. */
export const statusTone = (k: Status) => (k === "new" ? "new" : k === "done" || k === "cancel" ? "closed" : "open");

/** A product in the card: sizes and «по запросу» are edited as text. */
export type ProductDraft = Omit<Product, "sizes" | "customSizes"> & { sizes: { w: string; h: string; price: string }[]; customText: string };

export const toDraft = (p: Product): ProductDraft => {
  const { sizes, customSizes, ...rest } = p;
  return { ...rest, sizes: sizes.map((z) => ({ w: String(z.w), h: String(z.h), price: z.price == null ? "" : String(z.price) })), customText: customSizes.join(", ") };
};

/** Prototype saveProd: rows need width and height, empty price = on request, the `all` tag is always kept. */
export const fromDraft = (d: ProductDraft): Product => {
  const { sizes, customText, ...rest } = d;
  return {
    ...rest,
    title: d.title.trim() || "Без названия",
    description: d.description.trim(),
    image: d.image.trim(),
    flatImage: d.flatImage.trim(),
    categories: [...d.categories.filter((c) => c !== "all"), "all"],
    sizes: sizes.filter((z) => +z.w && +z.h).map((z) => ({ w: +z.w, h: +z.h, price: z.price === "" ? null : +z.price })),
    customSizes: customText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  };
};
