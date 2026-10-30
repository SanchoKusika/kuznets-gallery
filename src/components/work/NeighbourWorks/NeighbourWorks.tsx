import { Media } from "@/components/ui/Media/Media";
import { WorkLink } from "@/components/ui/WorkLink/WorkLink";
import { bem } from "@/lib/bem";
import type { ArtworkCard } from "@/lib/catalog";
import s from "./NeighbourWorks.module.scss";

const b = bem(s, "neighbour-works");

const SIDES = [
  ["prev", "Предыдущая", "←", "Назад"],
  ["next", "Следующая", "→", "Далее"],
] as const;

/** The previous and the next artwork of the catalogue, as in a museum catalogue: a thumbnail, the code and the title. */
export function NeighbourWorks({ prev, next }: { prev: ArtworkCard; next: ArtworkCard }) {
  const cards = { prev, next };
  return (
    <nav className={b()} aria-label="Соседние работы">
      {SIDES.map(([side, label, arrow, cursor]) => {
        const card = cards[side];
        return (
          <WorkLink key={side} href={card.href} className={b("link", { next: side === "next" })} data-cursor={cursor}>
            <Media src={card.src} sizes="(width >= 700px) 160px, 45vw" className={b("media")} imgClassName={b("img")} />
            <span className={b("text")}>
              <span className={b("label")}>
                {side === "prev" && `${arrow} `}
                <span className={b("label-word")}>{label} · </span>
                {card.code}
                {side === "next" && ` ${arrow}`}
              </span>
              <span className={b("title")}>{card.title}</span>
            </span>
          </WorkLink>
        );
      })}
    </nav>
  );
}
