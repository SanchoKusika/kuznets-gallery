import { bem } from "@/lib/bem";
import s from "./SizeList.module.scss";

const b = bem(s, "size-list");

export type SizeRow = { label: string; price: string; selected: boolean; pick: () => void };

/** «Размер / Цена» list with a dot on the picked row (the work page, «Примерьте размер»). */
export function SizeList({ rows, className }: { rows: SizeRow[]; className?: string }) {
  return (
    <div className={b(null, null, className)}>
      <div className={b("head")}>
        <span>Размер</span>
        <span>Цена</span>
      </div>
      {rows.map((r, i) => (
        <button key={i} type="button" className={b("row", { selected: r.selected })} aria-pressed={r.selected} onClick={r.pick}>
          <span className={b("label")}>
            <span className={b("dot")} />
            {r.label}
          </span>
          <span className={b("price")}>{r.price}</span>
        </button>
      ))}
    </div>
  );
}
