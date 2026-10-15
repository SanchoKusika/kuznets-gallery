// Dashboard numbers — a port of the prototype's renderVals() analytics (design/Admin.dc.html).
// Pure functions over requests and products; dates are local, as in the prototype.

import { ADMIN_CATS, ACTIVE, SOURCES, type Product, type Req, type Source, reqTotal } from "./model";
import { D, dshort, fmtM, fmtP, fmtS, num, ORDERS, PICTURES, count } from "./format";

export type Period = "30d" | "90d" | "12m";
export type Metric = "rev" | "cnt" | "avg";
export const PERIOD_NAME: Record<Period, string> = { "30d": "30 дней", "90d": "3 месяца", "12m": "12 месяцев" };

type Bucket = { a: number; b: number; lab: string; tip: string };

/** Chart buckets for a period; `shift` 1 = the previous period. */
export function buckets(per: Period, shift: number): Bucket[] {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const Y = t.getFullYear();
  const M = t.getMonth();
  const Dd = t.getDate();
  const out: Bucket[] = [];
  if (per === "30d") {
    for (let i = 29; i >= 0; i--) {
      const a = new Date(Y, M, Dd - i - shift * 30);
      const b = new Date(Y, M, Dd - i - shift * 30 + 1);
      out.push({ a: +a, b: +b, lab: i % 5 === 0 ? dshort(a) : "", tip: a.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" }) });
    }
  } else if (per === "90d") {
    const mon = Dd - ((t.getDay() + 6) % 7);
    for (let i = 12; i >= 0; i--) {
      const off = mon - 7 * (i + shift * 13);
      const a = new Date(Y, M, off);
      const b = new Date(Y, M, off + 7);
      out.push({ a: +a, b: +b, lab: i % 2 === 0 ? dshort(a) : "", tip: `${dshort(a)} — ${dshort(new Date(Y, M, off + 6))}` });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const a = new Date(Y, M - i - shift * 12, 1);
      const b = new Date(Y, M - i - shift * 12 + 1, 1);
      out.push({
        a: +a,
        b: +b,
        lab: a.toLocaleDateString("ru-RU", { month: "short" }).replace(".", ""),
        tip: a.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }).replace(/\s?г\.?$/, ""),
      });
    }
  }
  return out;
}

/** Nice axis maximum (prototype `niceMax`). */
function niceMax(v: number, no25: boolean) {
  if (!(v > 0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / e;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 && !no25 ? 2.5 : f <= 5 ? 5 : 10;
  return m * e;
}

const revenue = (l: Req[]) => l.reduce((a, q) => a + reqTotal(q).t, 0);
const pricedCount = (l: Req[]) => l.filter((q) => reqTotal(q).t > 0).length;
/** Change in percent, null without a base. */
const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);

export type Arrow = { arrow: string; up: boolean } | null;
export const arrowOf = (d: number | null): Arrow => (d == null ? null : { arrow: d >= 0 ? "↑" : "↓", up: d >= 0 });

/** The four KPI cards (last 30 days vs the 30 before). */
export function kpis(requests: Req[], now: number) {
  const live = requests.filter((r) => r.status !== "cancel");
  const fresh = requests.filter((r) => r.status === "new");
  const cnt = (k: string) => requests.filter((r) => r.status === k).length;
  const k0 = buckets("30d", 0);
  const k1 = buckets("30d", 1);
  const inRange = (q: Req, b: Bucket[]) => q.at >= b[0].a && q.at < b[b.length - 1].b;
  const L30 = live.filter((q) => inRange(q, k0));
  const P30 = live.filter((q) => inRange(q, k1));
  const r30 = revenue(L30);
  const rp = revenue(P30);
  const a30 = pricedCount(L30) ? r30 / pricedCount(L30) : 0;
  const ap = pricedCount(P30) ? rp / pricedCount(P30) : 0;
  const stale = fresh.filter((r) => now - r.at > D).length;
  const active = requests.filter((r) => ACTIVE.includes(r.status)).length;
  const dR = delta(r30, rp);
  const dA = delta(a30, ap);
  return {
    fresh: { v: fresh.length, dot: stale > 0, sub: stale ? `${stale} ${stale === 1 ? "ждёт" : "ждут"} больше суток` : "Все свежие" },
    active: { v: active, sub: `${cnt("prod")} в производстве · ${cnt("mockup")} на макете` },
    revenue: { v: fmtM(r30), arrow: arrowOf(dR), sub: dR == null ? count(L30.length, ORDERS) : `${Math.abs(dR)}% к прошлым 30 дням` },
    average: { v: fmtM(a30), arrow: arrowOf(dA), sub: dA == null ? "за 30 дней" : `${Math.abs(dA)}% к прошлым 30 дням` },
  };
}

export type ChartOptions = { met: Metric; per: Period; src: Source | "all"; dir: string; cmp: boolean };

/** Sales chart, its totals and the three breakdowns under it. */
export function sales(requests: Req[], products: Product[], o: ChartOptions) {
  const live = requests.filter((r) => r.status !== "cancel");
  const catOf = new Map(products.map((p) => [p.code, p.categories]));
  const inDir = (q: Req, dir: string) => dir === "all" || q.items.some((i) => (catOf.get(i.code) ?? []).includes(dir));
  const curB = buckets(o.per, 0);
  const prevB = buckets(o.per, 1);
  const n = curB.length;
  const lo = curB[0].a;
  const hi = curB[n - 1].b;
  const pool = live.filter((q) => (o.src === "all" || q.source === o.src) && inDir(q, o.dir));

  type Acc = { c: number; r: number; pc: number };
  const agg = (bks: Bucket[]) => {
    const out: Acc[] = bks.map(() => ({ c: 0, r: 0, pc: 0 }));
    const a0 = bks[0].a;
    const a1 = bks[bks.length - 1].b;
    for (const q of pool) {
      if (q.at < a0 || q.at >= a1) continue;
      const i = bks.findIndex((b) => q.at >= b.a && q.at < b.b);
      if (i < 0) continue;
      const t = reqTotal(q).t;
      out[i].c++;
      out[i].r += t;
      if (t > 0) out[i].pc++;
    }
    return out;
  };
  const mv = (x: Acc) => (o.met === "rev" ? x.r : o.met === "cnt" ? x.c : x.pc ? x.r / x.pc : 0);
  const sum = (a: Acc[]) => a.reduce((t, x) => ({ c: t.c + x.c, r: t.r + x.r, pc: t.pc + x.pc }), { c: 0, r: 0, pc: 0 });
  const curA = agg(curB);
  const prevA = agg(prevB);
  const cT = sum(curA);
  const pT = sum(prevA);
  const cV = curA.map(mv);
  const pV = prevA.map(mv);
  const curTot = mv(cT);
  const prevTot = mv(pT);
  const top = Math.max(0, ...cV, ...(o.cmp ? pV : [0]));
  const yMax = o.met === "cnt" && top <= 10 ? Math.max(2, Math.ceil(top / 2) * 2) : niceMax(top, o.met === "cnt");
  const pct = (v: number) => (v > 0 ? Math.max(1.5, Math.min(100, (v / yMax) * 100)) : 0);
  const fmtV = (v: number) => (o.met === "cnt" ? count(Math.round(v), ORDERS) : fmtP(Math.round(v)));
  const fmtY = (v: number) => (o.met === "cnt" ? num(v) : fmtS(v));
  const dT = delta(curTot, prevTot);

  const bars = curB.map((b, i) => ({
    h: pct(cV[i]),
    ph: pct(pV[i]),
    lab: b.lab,
    tip: { t: b.tip, v: fmtV(cV[i]), n: o.met !== "cnt" ? count(curA[i].c, ORDERS) : "", p: `Прошлый период: ${fmtV(pV[i])}` },
  }));

  // Breakdowns over the selected period.
  const inPer = (q: Req) => q.at >= lo && q.at < hi;
  const srcPool = live.filter((q) => inPer(q) && inDir(q, o.dir));
  const srcTot = srcPool.length;
  const sources = SOURCES.map((k) => {
    const l = srcPool.filter((q) => q.source === k);
    return { k, c: l.length, r: revenue(l) };
  })
    .sort((a, z) => z.c - a.c)
    .map((x) => {
      const sh = srcTot ? Math.round((x.c / srcTot) * 100) : 0;
      return { n: x.k as string, pct: sh, sub: `${count(x.c, ORDERS)} · ${fmtM(x.r)} сум` };
    });

  const dirAcc = new Map(ADMIN_CATS.map((c) => [c.k as string, { r: 0, q: 0 }]));
  for (const q of live) {
    if (!inPer(q) || (o.src !== "all" && q.source !== o.src)) continue;
    for (const it of q.items) {
      const cs = (catOf.get(it.code) ?? []).filter((c) => dirAcc.has(c));
      if (!cs.length) continue;
      const v = ((it.price || 0) * (it.qty || 1)) / cs.length;
      const qq = (it.qty || 1) / cs.length;
      for (const c of cs) {
        const acc = dirAcc.get(c)!;
        acc.r += v;
        acc.q += qq;
      }
    }
  }
  const dirTot = [...dirAcc.values()].reduce((a, x) => a + x.r, 0);
  const directions = ADMIN_CATS.map((c) => ({ c, ...dirAcc.get(c.k)! }))
    .sort((a, z) => z.r - a.r)
    .map((x) => {
      const sh = dirTot ? Math.round((x.r / dirTot) * 100) : 0;
      return { n: x.c.n, pct: sh, sub: `${count(Math.round(x.q), PICTURES)} · ${fmtM(x.r)} сум` };
    });

  const popAcc = new Map<string, { code: string; title: string; image: string; q: number; r: number }>();
  for (const q of pool) {
    if (!inPer(q)) continue;
    for (const it of q.items) {
      if (!it.code) continue;
      const a = popAcc.get(it.code) ?? { code: it.code, title: it.title, image: it.image, q: 0, r: 0 };
      a.q += it.qty || 1;
      a.r += (it.price || 0) * (it.qty || 1);
      popAcc.set(it.code, a);
    }
  }
  const byCode = new Map(products.map((p) => [p.code, p]));
  const popular = [...popAcc.values()]
    .sort((a, z) => z.q - a.q || z.r - a.r)
    .slice(0, 5)
    .map((x, i) => {
      const p = byCode.get(x.code);
      return { i: String(i + 1).padStart(2, "0"), code: x.code, title: p ? p.title : x.title, image: p ? p.image : x.image, q: `× ${x.q}`, r: `${fmtM(x.r)} сум` };
    });

  return {
    total: o.met === "cnt" ? num(cT.c) : fmtM(Math.round(curTot)),
    unit: o.met === "cnt" ? count(cT.c, ORDERS).replace(/^\d+ /, "") : "сум",
    arrow: arrowOf(dT),
    delta: dT == null ? "Нет данных за прошлый период" : `${Math.abs(dT)}% к прошлому периоду`,
    prev: `Прошлый период — ${o.met === "cnt" ? count(pT.c, ORDERS) : `${fmtM(Math.round(prevTot))} сум`}`,
    bars,
    yTop: fmtY(yMax),
    yMid: fmtY(yMax / 2),
    sources,
    directions,
    popular,
  };
}
