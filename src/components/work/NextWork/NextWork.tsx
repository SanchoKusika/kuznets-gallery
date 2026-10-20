import { Media } from "@/components/ui/Media/Media";
import { WorkLink } from "@/components/ui/WorkLink/WorkLink";
import { bem } from "@/lib/bem";
import type { ArtworkCard } from "@/lib/catalog";
import s from "./NextWork.module.scss";

const b = bem(s, "next-work");

/** Dark full-width teaser of the next artwork in the catalogue. */
export function NextWork({ card }: { card: ArtworkCard }) {
  return (
    <WorkLink href={card.href} className={b()} data-cursor="Далее">
      <Media src={card.src} sizes="100vw" className={b("media")} imgClassName={b("img")} />
      <div className={b("text")}>
        <span className={b("label")}>Следующая работа · {card.code}</span>
        <span className={b("title")}>{card.title}</span>
      </div>
    </WorkLink>
  );
}
