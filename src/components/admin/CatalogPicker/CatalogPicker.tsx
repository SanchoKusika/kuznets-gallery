"use client";

import { useState } from "react";
import { SearchField } from "@/components/admin/ui/SearchField/SearchField";
import { Thumb } from "@/components/admin/ui/Thumb/Thumb";
import { fmtP } from "@/features/admin/format";
import { minPrice, type Product } from "@/features/admin/model";
import { useAdmin } from "@/features/admin/store";
import { bem } from "@/lib/bem";
import s from "./CatalogPicker.module.scss";

const b = bem(s, "catalog-picker");

/** Search of the catalogue by title or code with the first `limit` matches; a click adds the work to a request. */
export function CatalogPicker({ onPick, limit = 6 }: { onPick: (p: Product) => void; limit?: number }) {
  const { products } = useAdmin();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = products.filter((p) => !query || `${p.title} ${p.code}`.toLowerCase().includes(query)).slice(0, limit);
  return (
    <div className={b()}>
      <SearchField value={q} onChange={setQ} placeholder="Найти картину по названию или коду" />
      {results.map((p) => {
        const mp = minPrice(p);
        return (
          <button key={p.code} type="button" className={b("result")} onClick={() => onPick(p)}>
            <Thumb image={p.image} sizes="40px" className={b("thumb")} />
            <span className={b("title")}>
              {p.title}
              <span className={b("code")}>{p.code}</span>
            </span>
            <span className={b("price")}>{mp != null ? `от ${fmtP(mp)}` : "по запросу"}</span>
          </button>
        );
      })}
      {!results.length && <p className={b("empty")}>Ничего не найдено.</p>}
    </div>
  );
}
