// Admin formatting helpers — the prototype's num / fmtP / fmtM / ago / dstr… (design/Admin.dc.html).
// Numbers are grouped with a thin space, as in the prototype's admin.

import { groupThousands, plural } from "@/lib/format";

export const H = 36e5;
export const D = 24 * H;

/** 90000 → "90 000" (thin space). */
export const num = (n: number) => groupThousands(Math.round(n), " ");
/** "90 000 сум"; null → "по запросу". */
export const fmtP = (n: number | null | undefined) => (n == null ? "по запросу" : `${num(n)} сум`);
const dec1 = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");
/** Millions with one decimal: 12 400 000 → "12,4 млн". */
export const fmtM = (n: number) => (n >= 1e6 ? `${dec1(n / 1e6)} млн` : num(n));
/** Axis labels: "1,2 млн", "450 тыс". */
export const fmtS = (n: number) => (n >= 1e6 ? `${dec1(n / 1e6)} млн` : n >= 1e3 ? `${Math.round(n / 1e3)} тыс` : num(n));

/** "12 окт" */
export const dshort = (t: number | Date) => new Date(t).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", "");
/** "12 окт" this year, "12 окт 2025" otherwise. */
export const dstr = (t: number | Date) =>
  new Date(t).getFullYear() === new Date().getFullYear() ? dshort(t) : `${dshort(t)} ${new Date(t).getFullYear()}`;
/** "14:05" */
export const hm = (t: number) => new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

/** "5 мин назад", "3 ч назад", "вчера", then a date. */
export function ago(t: number) {
  const m = (Date.now() - t) / 6e4;
  if (m < 60) return `${Math.max(1, Math.round(m))} мин назад`;
  if (m < 1440) return `${Math.round(m / 60)} ч назад`;
  if (m < 2880) return "вчера";
  return dstr(t);
}

/** Local date as "YYYY-MM-DD". */
export function isoDay(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Forms = readonly [string, string, string];
export const ORDERS: Forms = ["заказ", "заказа", "заказов"];
export const PICTURES: Forms = ["картина", "картины", "картин"];
export const REQUESTS: Forms = ["заявка", "заявки", "заявок"];
export const SIZES: Forms = ["размер", "размера", "размеров"];

/** "5 заказов" */
export const count = (n: number, f: Forms) => `${n} ${plural(n, ...f)}`;

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
