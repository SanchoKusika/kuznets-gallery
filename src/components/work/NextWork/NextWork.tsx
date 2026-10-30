import { Media } from "@/components/ui/Media/Media";
import { WorkLink } from "@/components/ui/WorkLink/WorkLink";
import { FMT } from "@/content/site";
import { bem } from "@/lib/bem";
import type { ArtworkCard } from "@/lib/catalog";
import s from "./NextWork.module.scss";

const b = bem(s, "next-work");

/** Teaser of the next artwork in the catalogue: title, description and price beside the whole picture. */
export function NextWork({ card }: { card: ArtworkCard }) {
  return (
    <WorkLink href={card.href} className={b()} data-cursor="Далее">
      <div className={b("text")}>
        <div className={b("intro")}>
          <span className={b("label")}>Следующая работа</span>
          <span className={b("title")}>{card.title}</span>
          {card.description && <span className={b("description")}>{card.description}</span>}
        </div>
        <div className={b("meta")}>
          <span className={b("facts")}>{`${card.code} · ${FMT[card.format]} · ${card.from}`}</span>
          <span className={b("arrow")} aria-hidden="true">
            →
          </span>
        </div>
      </div>
      <Media src={card.src} sizes="(width >= 1240px) 520px, (width >= 700px) 45vw, 100vw" className={b("media")} imgClassName={b("img")} />
    </WorkLink>
  );
}
