import cafePortrait from "@/assets/images/cafe-portrait.webp";
import { Media } from "@/components/ui/Media/Media";
import { FMT, type FormatKey } from "@/content/site";
import { bem } from "@/lib/bem";
import { formatPrice, groupThousands } from "@/lib/format";
import s from "./Pricing.module.scss";

const b = bem(s, "pricing");

export type PriceRow = { size: string; format: FormatKey; price: string };

type Props = { rows: PriceRow[]; min: number; max: number | null };

/** «Цена зависит от размера»: sticky intro (≥960) and the price list by size. */
export function Pricing({ rows, min, max }: Props) {
  return (
    <section className={b()} data-reveal>
      <div className={b("intro")}>
        <h2 className={b("title")}>Цена зависит от размера</h2>
        <p className={b("text")}>
          Для работ на заказ к цене добавляется работа дизайнера. Чем больше размер, тем выгоднее: 100/100 см в 4 раза больше по
          площади, чем 50/50 см, а дороже лишь в 2,7 раза.
        </p>
        <span className={b("from")}>от {groupThousands(min)} сум</span>
        <span className={b("max")}>Максимум в прайсе — {max == null ? "" : formatPrice(max)}</span>
        <div className={b("figure")}>
          <Media
            src={cafePortrait}
            alt="Принт-картина в интерьере кафе"
            sizes="(width >= 900px) 620px, 100vw"
            className={b("media")}
            imgClassName={b("img")}
          />
          <span className={b("plate")}>В интерьере</span>
        </div>
      </div>

      <div className={b("table")}>
        <div className={b("row", { head: true })}>
          <span>Размер, см</span>
          <span>Формат</span>
          <span>Холст на подрамнике</span>
        </div>
        {rows.map((r) => (
          <div key={r.size} className={b("row")}>
            <span className={b("size")}>{r.size}</span>
            <span className={b("format")}>{FMT[r.format]}</span>
            <span>{r.price}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
