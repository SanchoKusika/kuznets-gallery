import Link from "next/link";
import { Icon } from "@/components/ui/Icon/Icon";
import { Media } from "@/components/ui/Media/Media";
import { bem } from "@/lib/bem";
import { plural } from "@/lib/format";
import s from "./Categories.module.scss";

const b = bem(s, "categories");

type Row = { key: string; name: string; desc: string; count: number; img: string; href: string };

/**
 * "Выберите направление": one row per category. With a mouse the cover follows the
 * cursor (stage 5); on touch screens ≥960px it is shown as a thumbnail instead.
 */
export function Categories({ rows }: { rows: Row[] }) {
  return (
    <section className={b()} data-reveal>
      <h2 className={b("title")}>Выберите направление</h2>
      <div className={b("list")}>
        {rows.map((r) => (
          <Link key={r.key} href={r.href} className={b("row")} data-cursor="Открыть" data-preview={r.img}>
            <div className={b("text")}>
              <span className={b("name")}>{r.name}</span>
              <span className={b("desc")}>{r.desc}</span>
            </div>
            {/* Number and word are separate flex items (10px apart), as rendered in the prototype. */}
            <span className={b("count")}>
              <span>{r.count}</span>
              <span>{plural(r.count, "работа", "работы", "работ")}</span>
              <Icon name="arrow-right" />
            </span>
            <Media src={r.img} sizes="120px" className={b("thumb")} imgClassName={b("thumb-img")} />
          </Link>
        ))}
      </div>
    </section>
  );
}
