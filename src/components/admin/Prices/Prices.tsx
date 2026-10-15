"use client";

import { useState } from "react";
import { Chip } from "@/components/admin/ui/Chip/Chip";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { count, num, PICTURES } from "@/features/admin/format";
import { useLayout } from "@/features/admin/layout";
import type { Product } from "@/features/admin/model";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./Prices.module.scss";

const b = bem(s, "prices");

const PCT_CHIPS = [-10, 5, 10, 15, 20];
const ROUNDS = [1000, 5000, 10000];

type StdSize = { key: string; w: number; h: number; n: number; mode: number; others: number };

/** Standard sizes with the most common price of each (prototype `sizeList`). */
function standardSizes(products: Product[]): StdSize[] {
  const map = new Map<string, { w: number; h: number; n: number; prices: Map<number, number> }>();
  for (const p of products)
    for (const z of p.sizes) {
      if (z.price == null) continue;
      const key = `${z.w}×${z.h}`;
      const m = map.get(key) ?? { w: z.w, h: z.h, n: 0, prices: new Map() };
      m.n++;
      m.prices.set(z.price, (m.prices.get(z.price) ?? 0) + 1);
      map.set(key, m);
    }
  return [...map]
    .map(([key, m]) => {
      const byCount = [...m.prices].sort((a, z) => z[1] - a[1]);
      return { key, w: m.w, h: m.h, n: m.n, mode: byCount[0][0], others: byCount.length - 1 };
    })
    .sort((a, z) => a.w * a.h - z.w * z.h);
}

/** «Прайс»: prices of standard sizes and a percentage change of every price, both with «Вернуть». */
export function Prices() {
  const { mw, tier } = useLayout();
  const { products, applySizes } = useAdmin();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pct, setPct] = useState("10");
  const [round, setRound] = useState(5000);
  const sizes = standardSizes(products);

  const bump = (p: number) => Math.max(round, Math.round((p * (1 + (+pct || 0) / 100)) / round) * round);

  const commit = (z: StdSize) => {
    const v = +(drafts[z.key] || "");
    setDrafts((d) => {
      const rest = { ...d };
      delete rest[z.key];
      return rest;
    });
    if (!v || v === z.mode) return;
    let n = 0;
    const next = products.map((p) =>
      p.sizes.some((y) => `${y.w}×${y.h}` === z.key && y.price === z.mode)
        ? { ...p, sizes: p.sizes.map((y) => (`${y.w}×${y.h}` === z.key && y.price === z.mode ? (n++, { ...y, price: v }) : y)) }
        : p,
    );
    applySizes(next, `${z.key} см: ${num(z.mode)} → ${num(v)} · ${count(n, PICTURES)}`);
  };

  const applyPct = () => {
    if (!+pct) return;
    const next = products.map((p) => (p.sizes.some((z) => z.price != null) ? { ...p, sizes: p.sizes.map((z) => (z.price == null ? z : { ...z, price: bump(z.price) })) } : p));
    applySizes(next, `Цены изменены на ${+pct > 0 ? "+" : ""}${+pct}%`);
  };

  const preview = [...sizes]
    .sort((a, z) => z.n - a.n)
    .slice(0, 4)
    .sort((a, z) => a.w * a.h - z.w * z.h);

  return (
    <div className={b()}>
      <section className={b("card")}>
        <div className={b("head")}>
          <h2 className={b("title")}>Стандартные размеры</h2>
          <span className={b("count")}>{sizes.length || ""}</span>
        </div>
        <p className={b("hint")}>Новая цена применяется ко всем картинам этого размера с текущей ценой. Нажмите Enter или уйдите из поля — сохранится сразу.</p>
        <div className={b("thead", { tier: tier === 0 ? 0 : 1 })}>
          <span>Размер</span>
          <span className={b("count-col")}>Картин</span>
          <span className={b("price-head")}>Цена, сум</span>
        </div>
        {sizes.map((z) => (
          <div key={z.key} className={b("row", { tier: tier === 0 ? 0 : 1 })}>
            <span className={b("label")}>
              {`${z.w} × ${z.h} см`}
              <span className={b("label-sub")}>{count(z.n, PICTURES)}</span>
            </span>
            <span className={b("count-col", null, b("works"))}>
              {count(z.n, PICTURES)}
              <span className={b("others")}>{z.others ? `ещё ${z.others} ${z.others === 1 ? "другая цена" : "другие цены"}` : ""}</span>
            </span>
            <input
              className={b("input")}
              value={drafts[z.key] != null ? (drafts[z.key] ? num(+drafts[z.key]) : "") : num(z.mode)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setDrafts((d) => ({ ...d, [z.key]: v }));
              }}
              onBlur={() => commit(z)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              inputMode="numeric"
              aria-label="Цена"
            />
          </div>
        ))}
      </section>

      <section className={b("card", { all: true, sticky: mw >= 892 })}>
        <div>
          <h2 className={b("title")}>Изменить все цены</h2>
          <p className={b("lede")}>Когда дорожает холст или багет — поднимите цены сразу во всём каталоге.</p>
        </div>
        <div className={b("group")}>
          <span className={b("caption")}>Изменение</span>
          <div className={b("pct")}>
            <input
              className={b("pct-input")}
              value={pct}
              onChange={(e) =>
                setPct(
                  e.target.value
                    .replace(/[^\d-]/g, "")
                    .replace(/(?!^)-/g, "")
                    .slice(0, 4),
                )
              }
              inputMode="numeric"
              aria-label="Процент"
            />
            <span className={b("pct-sign")}>%</span>
          </div>
          <div className={b("chips")}>
            {PCT_CHIPS.map((v) => (
              <Chip key={v} label={`${v > 0 ? "+" : ""}${v}%`} active={+pct === v} onClick={() => setPct(String(v))} />
            ))}
          </div>
        </div>
        <div className={b("group")}>
          <span className={b("caption")}>Округлять до</span>
          <div className={b("chips")}>
            {ROUNDS.map((v) => (
              <Chip key={v} label={num(v)} active={round === v} onClick={() => setRound(v)} />
            ))}
          </div>
        </div>
        <div className={b("preview")}>
          {preview.map((z) => (
            <div key={z.key} className={b("preview-row")}>
              <span>
                {`${z.w} × ${z.h} см`}
              </span>
              <span className={b("preview-values")}>
                <span className={b("preview-from")}>{num(z.mode)}</span>
                {` → ${num(bump(z.mode))}`}
              </span>
            </div>
          ))}
        </div>
        <DsButton size="lg" block onClick={applyPct}>
          Применить ко всем картинам
        </DsButton>
      </section>
    </div>
  );
}
