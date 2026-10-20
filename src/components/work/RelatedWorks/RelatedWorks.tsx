import { ArtworkCard } from "@/components/catalog/ArtworkCard/ArtworkCard";
import { bem } from "@/lib/bem";
import type { ArtworkCard as Card } from "@/lib/catalog";
import s from "./RelatedWorks.module.scss";

const b = bem(s, "related-works");

/** "Ещё <направление>": two rows of works after this one, same category first (CSS hides what doesn't fit). */
export function RelatedWorks({ category, cards }: { category: string; cards: Card[] }) {
  return (
    <section className={b()} data-reveal>
      <div className={b("head")}>
        <span>Ещё</span>
        <span>{category}</span>
      </div>
      <div className={b("grid")}>
        {cards.map((card) => (
          <ArtworkCard key={card.code} card={card} variant="related" />
        ))}
      </div>
    </section>
  );
}
