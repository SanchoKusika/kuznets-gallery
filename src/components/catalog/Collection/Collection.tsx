"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArtworkCard } from "@/components/catalog/ArtworkCard/ArtworkCard";
import { ArtworkRow } from "@/components/catalog/ArtworkRow/ArtworkRow";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { FMT, type CategoryKey, type FormatKey } from "@/content/site";
import { PAGE_SIZE, useCollectionFilters, type CollectionFilters, type Sort } from "@/features/catalog/filters";
import { rememberCategory } from "@/features/catalog/last-category";
import { order } from "@/features/order/store";
import { useCrookedSlot } from "@/features/whimsy/crooked-card";
import { bem } from "@/lib/bem";
import type { ArtworkCard as Card } from "@/lib/catalog";
import { worksWord } from "@/lib/format";
import { useMediaQuery } from "@/lib/use-media-query";
import s from "./Collection.module.scss";

const b = bem(s, "collection");

const FORMATS: [CollectionFilters["format"], string][] = [
  ["all", "Все форматы"],
  ...(Object.entries(FMT) as [FormatKey, string][]),
];
const SORT_LABELS = ["по умолчанию", "по возрастанию", "по убыванию"];

export type CategoryChip = { key: string; label: string; count: number; href: string; active: boolean };

type Props = { category: CategoryKey | "all"; title: string; items: Card[]; chips: CategoryChip[] };

/** Collection page body (prototype "02 Коллекция"): filters, grid / list, "Показать ещё". */
export function Collection({ category, title, items, chips }: Props) {
  const [{ format, sort, query, view, limit }, setFilters] = useCollectionFilters();
  const wide = useMediaQuery("(width >= 900px)", true);
  const [crookedSlot, straighten] = useCrookedSlot();
  useEffect(() => rememberCategory(category), [category]);
  const asList = wide && view === "list";

  let list = format === "all" ? items : items.filter((p) => p.format === format);
  const q = query.trim().toLowerCase();
  if (q) list = list.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q));
  if (sort) list = [...list].sort((a, z) => ((a.minPrice ?? 1e12) - (z.minPrice ?? 1e12)) * (sort === 1 ? 1 : -1));
  const visible = list.slice(0, limit);

  // A new category, format or search starts the list over (prototype: `limit: null`).
  const filter = (patch: Partial<CollectionFilters>) => setFilters({ ...patch, limit: PAGE_SIZE });

  return (
    <>
      <section className={b("head")} data-reveal>
        <h1 className={b("title")}>{title}</h1>
        <div className={b("meta")}>
          <span className={b("count")}>
            {list.length} {worksWord(list.length)}
          </span>
          <span className={b("lede")}>Выбирайте сочетания по цвету, стилю и смыслу. Другое соотношение сторон — на заказ.</span>
        </div>
      </section>

      <section className={b("filters")}>
        <div className={b("chips")}>
          {chips.map((c) => (
            <Link key={c.key} href={c.href} scroll={false} className={b("chip", { active: c.active })} onClick={() => filter({})}>
              {c.label}
              <span className={b("chip-count")}>{c.count}</span>
            </Link>
          ))}
        </div>
        <div className={b("tools")}>
          <div className={b("formats")}>
            {FORMATS.map(([key, label]) => (
              <button key={key} type="button" className={b("format", { active: format === key })} onClick={() => filter({ format: key })}>
                {label}
              </button>
            ))}
          </div>
          <span className={b("divider")} />
          {/* "Цена:" and the label are separate flex items, as in the prototype. */}
          <button type="button" className={b("sort")} onClick={() => setFilters({ sort: ((sort + 1) % 3) as Sort })}>
            <Icon name="sort" size={14} />
            Цена:
            <span>{SORT_LABELS[sort]}</span>
          </button>
          <label className={b("search")}>
            <Icon name="search" size={14} />
            <input
              className={b("search-input")}
              value={query}
              onChange={(e) => filter({ query: e.target.value })}
              placeholder="Поиск по названию"
              aria-label="Поиск по названию"
            />
          </label>
          {wide && (
            <div className={b("views")}>
              <button type="button" className={b("view", { active: !asList })} onClick={() => setFilters({ view: "grid" })}>
                <Icon name="grid" size={14} />
                Сетка
              </button>
              <button type="button" className={b("view", { active: asList })} onClick={() => setFilters({ view: "list" })}>
                <Icon name="list" size={14} />
                Список
              </button>
            </div>
          )}
        </div>
      </section>

      {asList ? (
        <section className={b("list")}>
          {visible.map((card) => (
            <ArtworkRow key={card.code} card={card} />
          ))}
        </section>
      ) : (
        <section className={b("grid")}>
          {visible.map((card, i) => (
            <ArtworkCard key={card.code} card={card} crooked={i === crookedSlot} onStraighten={straighten} />
          ))}
        </section>
      )}

      {items.length > 0 && list.length === 0 && (
        <div className={b("empty")}>
          Ничего не нашлось. Можно сделать картину на заказ —{" "}
          <button type="button" className={b("empty-link")} onClick={order.open}>
            оставить заявку
          </button>
          .
        </div>
      )}

      {list.length > limit && (
        <div className={b("more")}>
          <Button variant="outline" regular className={b("more-button")} onClick={() => setFilters({ limit: limit + PAGE_SIZE })}>
            Показать ещё · {list.length - limit}
          </Button>
        </div>
      )}
    </>
  );
}
