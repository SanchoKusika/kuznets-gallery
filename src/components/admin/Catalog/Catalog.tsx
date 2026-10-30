"use client";

import { useRef, useState, type DragEvent } from "react";
import { Chip } from "@/components/admin/ui/Chip/Chip";
import { DsButton } from "@/components/admin/ui/DsButton/DsButton";
import { PillSelect } from "@/components/admin/ui/PillSelect/PillSelect";
import { SearchField } from "@/components/admin/ui/SearchField/SearchField";
import { Switch } from "@/components/admin/ui/Switch/Switch";
import { Thumb } from "@/components/admin/ui/Thumb/Thumb";
import { count, num, SIZES } from "@/features/admin/format";
import { useLayout } from "@/features/admin/layout";
import { ADMIN_CATS, minPrice, type Product } from "@/features/admin/model";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./Catalog.module.scss";

const b = bem(s, "catalog");

const PAGE = 40;
type Sort = "site" | "code" | "title" | "price";
const SORTS = [
  { v: "site", l: "Как на сайте" },
  { v: "code", l: "По коду" },
  { v: "title", l: "По названию" },
  { v: "price", l: "По цене" },
];

/** Size summary of a row: "3 размера", "25×25 — 70×100 · +1 по запросу". */
function sizeSummary(p: Product) {
  const ss = [...p.sizes].sort((a, z) => a.w * a.h - z.w * z.h);
  const last = ss[ss.length - 1];
  const range = ss.length ? `${ss[0].w}×${ss[0].h}${ss.length > 1 ? ` — ${last.w}×${last.h}` : ""}` : "";
  const extra = p.customSizes.length ? `${ss.length ? " · " : ""}+${p.customSizes.length} по запросу` : "";
  return { n: ss.length ? count(ss.length, SIZES) : "по запросу", range: range + extra };
}

/**
 * «Каталог»: direction chips and «Скрытые», search, sort, bulk actions, 40 rows + «Показать ещё».
 * In the site's order of the whole catalogue (no filter, no search) rows are dragged to reorder the site.
 */
export function Catalog() {
  const { mode, tier } = useLayout();
  const { products, openProd, setHidden, deleteProds, moveProds, moveProdsToTop, visit } = useAdmin();
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("site");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const dragCode = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  // The row under the dragged one and the half of it: the row is dropped before or after it.
  const [drop, setDrop] = useState<{ code: string; after: boolean } | null>(null);
  const [seenVisit, setSeenVisit] = useState(visit);
  if (visit !== seenVisit) {
    setSeenVisit(visit);
    setLimit(PAGE);
    setSelected({});
  }

  const q = query.trim().toLowerCase();
  const base = products.filter((p) => !q || `${p.title} ${p.code} ${p.description}`.toLowerCase().includes(q));
  let list = base.filter((p) => filter === "all" || (filter === "hidden" ? p.hidden : p.categories.includes(filter)));
  if (sort === "title") list = [...list].sort((a, z) => a.title.localeCompare(z.title, "ru"));
  if (sort === "price") list = [...list].sort((a, z) => (minPrice(a) ?? 1e12) - (minPrice(z) ?? 1e12));
  if (sort === "code") list = [...list].sort((a, z) => a.code.localeCompare(z.code));

  const chips = [
    { k: "all", label: "Все", count: base.length },
    ...ADMIN_CATS.map((c) => ({ k: c.k as string, label: c.n, count: base.filter((p) => p.categories.includes(c.k)).length })),
    { k: "hidden", label: "Скрытые", count: base.filter((p) => p.hidden).length },
  ];
  const selKeys = Object.keys(selected).filter((k) => selected[k]);
  const allSel = list.length > 0 && list.every((p) => selected[p.code]);
  const bulk = (fn: (codes: string[]) => void) => {
    fn(selKeys);
    setSelected({});
  };

  // Reordering: only the full list in the site's order, and not on touch screens (the bottom tab bar layout).
  const reorder = sort === "site" && filter === "all" && !q && mode !== "bar";
  const endDrag = () => {
    dragCode.current = null;
    setDragging(null);
    setDrop(null);
  };
  const dragOver = (e: DragEvent, code: string) => {
    if (!dragCode.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const r = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    if (drop?.code !== code || drop.after !== after) setDrop({ code, after });
  };
  const dropOn = (e: DragEvent) => {
    e.preventDefault();
    const code = dragCode.current;
    const target = drop;
    endDrag();
    if (!code || !target || target.code === code) return;
    const i = list.findIndex((p) => p.code === target.code);
    const before = target.after ? (list.slice(i + 1).find((p) => p.code !== code)?.code ?? null) : target.code;
    moveProds([code], before, "Порядок на сайте изменён");
  };

  return (
    <>
      <div className={b("toolbar")}>
        <div className={b("chips", { scroll: tier === 0 })}>
          {chips.map((c) => (
            <Chip
              key={c.k}
              label={c.label}
              count={c.count}
              active={filter === c.k}
              onClick={() => {
                setFilter(c.k);
                setLimit(PAGE);
              }}
            />
          ))}
        </div>
        <div className={b("tools")}>
          <div className={b("search")}>
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setLimit(PAGE);
              }}
              placeholder="Название или код KZ-…"
            />
          </div>
          <PillSelect tone="soft" aria-label="Сортировка" options={SORTS} value={sort} onChange={(v) => setSort(v as Sort)} />
        </div>
      </div>

      {selKeys.length > 0 && (
        <div className={b("bulk", { bar: mode === "bar" })}>
          <span className={b("bulk-count")}>{`Выбрано: ${selKeys.length}`}</span>
          <div className={b("bulk-actions")}>
            <button type="button" className={b("bulk-button")} onClick={() => bulk((c) => setHidden(c, false))}>
              Показать на сайте
            </button>
            <button type="button" className={b("bulk-button")} onClick={() => bulk((c) => setHidden(c, true))}>
              Скрыть
            </button>
            <button type="button" className={b("bulk-button")} title="Первыми на сайте" onClick={() => bulk(moveProdsToTop)}>
              Наверх
            </button>
            <button type="button" className={b("bulk-delete")} onClick={() => bulk(deleteProds)}>
              Удалить
            </button>
            <button type="button" className={b("bulk-clear")} aria-label="Снять выделение" onClick={() => setSelected({})}>
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={b("table", { tier })}>
        <div className={b("thead")}>
          <button
            type="button"
            className={b("check", { on: allSel })}
            aria-label="Выбрать все"
            onClick={() => setSelected(allSel ? {} : Object.fromEntries(list.map((p) => [p.code, true])))}
          >
            {allSel ? "✓" : ""}
          </button>
          <span />
          <span className={b("full")}>Код</span>
          <span>Картина</span>
          <span className={b("full")}>Направления</span>
          <span className={b("wide")}>Размеры</span>
          <span className={b("wide")}>Цена</span>
          <span>Сайт</span>
        </div>
        {list.slice(0, limit).map((p) => {
          const on = !p.hidden;
          const sel = !!selected[p.code];
          const sz = sizeSummary(p);
          const mp = minPrice(p);
          return (
            <div
              key={p.code}
              className={b("row", {
                selected: sel,
                draggable: reorder,
                dragging: dragging === p.code,
                "drop-before": drop?.code === p.code && !drop.after,
                "drop-after": drop?.code === p.code && drop.after,
              })}
              onClick={() => openProd(p.code)}
              draggable={reorder}
              onDragStart={(e) => {
                dragCode.current = p.code;
                e.dataTransfer.effectAllowed = "move";
                try {
                  e.dataTransfer.setData("text/plain", p.code);
                } catch {}
                setTimeout(() => setDragging(p.code), 0);
              }}
              onDragEnd={endDrag}
              onDragOver={(e) => dragOver(e, p.code)}
              onDrop={dropOn}
            >
              <button
                type="button"
                className={b("check", { on: sel })}
                aria-label="Выбрать"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((st) => ({ ...st, [p.code]: !st[p.code] }));
                }}
              >
                {sel ? "✓" : ""}
              </button>
              <Thumb image={p.image} sizes="56px" dim={!on} className={b("thumb")} />
              <span className={b("code", null, b("full"))}>{p.code}</span>
              <span className={b("name")}>
                <span className={b("title")}>{p.title || "Без названия"}</span>
                <span className={b("desc")}>{p.description || "—"}</span>
              </span>
              <span className={b("dirs", null, b("full"))}>
                {ADMIN_CATS.filter((c) => p.categories.includes(c.k))
                  .map((c) => c.s)
                  .join(" · ") || "—"}
              </span>
              <span className={b("sizes", null, b("wide"))}>
                <span className={b("sizes-n")}>{sz.n}</span>
                <span className={b("sizes-range")}>{sz.range}</span>
              </span>
              <span className={b("price", null, b("wide"))}>{mp != null ? `от ${num(mp)}` : "по запросу"}</span>
              <Switch
                on={on}
                label="Показывать на сайте"
                onClick={(e) => {
                  e.stopPropagation();
                  setHidden([p.code], on, true);
                }}
              />
            </div>
          );
        })}
        {!list.length && <p className={b("empty")}>Ничего не найдено.</p>}
      </div>
      <div className={b("foot")}>
        <span className={b("shown")}>
          {`Показано ${Math.min(limit, list.length)} из ${list.length}`}
          {reorder && list.length > 1 && " · перетащите строку, чтобы поменять порядок на сайте"}
        </span>
        {list.length > limit && (
          <DsButton variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
            Показать ещё
          </DsButton>
        )}
      </div>
    </>
  );
}
