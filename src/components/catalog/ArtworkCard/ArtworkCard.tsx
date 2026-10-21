import { Media } from "@/components/ui/Media/Media";
import { WorkLink } from "@/components/ui/WorkLink/WorkLink";
import { bem } from "@/lib/bem";
import type { ArtworkCard as Card } from "@/lib/catalog";
import s from "./ArtworkCard.module.scss";

const b = bem(s, "artwork-card");

/** Both grids — the collection and «Ещё» — have 2 / 3 / 4 / 6 columns (artwork-grid in _mixins.scss). */
const SIZES = "(width >= 1680px) 17vw, (width >= 1100px) 25vw, (width >= 800px) 33vw, 50vw";

/**
 * Artwork tile, 4:5. `grid` — collection grid (title + code, size range + price);
 * `related` — "Ещё" on the artwork page (title + price).
 */
export function ArtworkCard({ card, variant = "grid" }: { card: Card; variant?: "grid" | "related" }) {
  const grid = variant === "grid";
  return (
    <WorkLink href={card.href} className={b(null, { related: !grid })} data-cursor="Смотреть" data-reveal={grid || undefined}>
      <Media
        src={card.src}
        alt={card.title}
        sizes={SIZES}
        className={b("media")}
        imgClassName={b("img")}
      />
      <div className={b("line")}>
        <span className={b("title")}>{card.title}</span>
        <span className={b(grid ? "code" : "price")}>{grid ? card.code : card.from}</span>
      </div>
      {grid && (
        <div className={b("meta")}>
          <span>{card.range}</span>
          <span className={b("price")}>{card.from}</span>
        </div>
      )}
    </WorkLink>
  );
}
