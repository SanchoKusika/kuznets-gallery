import { ArtworkMorph } from "@/components/ui/ArtworkMorph/ArtworkMorph";
import { Button } from "@/components/ui/Button/Button";
import { Media } from "@/components/ui/Media/Media";
import { WorkLink } from "@/components/ui/WorkLink/WorkLink";
import { OrderButton } from "@/features/order/OrderButton";
import { bem } from "@/lib/bem";
import type { ArtworkCard } from "@/lib/catalog";
import { worksWord } from "@/lib/format";
import { routes } from "@/lib/routes";
import s from "./Hero.module.scss";

const b = bem(s, "hero");

export function Hero({ thumbs, total }: { thumbs: ArtworkCard[]; total: number }) {
  const stats = [
    ["от 90 000 сум", "за картину"],
    ["3–7 дней", "изготовление"],
    [`${total} ${worksWord(total)}`, "в коллекции"],
    ["Узбекистан", "доставка по стране"],
  ];

  return (
    <section className={b()} data-reveal>
      <div className={b("intro")}>
        <div className={b("lede-group")}>
          <div className={b("eyebrow")}>Kuznetsovs Gallery — Ташкент</div>
          <p className={b("lede")}>Принт-картины, объединяющие традиционное и современное. В наличии и на заказ.</p>
        </div>
        <div className={b("cta")}>
          <div className={b("buttons")}>
            <Button href={routes.collection()} icon="arrow-right" iconEnd>
              Смотреть коллекцию
            </Button>
            <OrderButton variant="outline" icon="pen">
              Сделать на заказ
            </OrderButton>
          </div>
          <div className={b("stats")}>
            {stats.map(([value, label]) => (
              <div key={label} className={b("stat")}>
                <span className={b("stat-value")}>{value}</span>
                <span className={b("stat-label")}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={b("thumbs")}>
        {thumbs.map((t) => (
          <WorkLink key={t.href} href={t.href} className={b("thumb")} data-cursor="Смотреть">
            <ArtworkMorph code={t.code}>
              <Media
                src={t.src}
                alt={t.title}
                sizes="(width >= 1000px) 16vw, 33vw"
                className={b("thumb-media")}
                imgClassName={b("thumb-img")}
                eager
              />
            </ArtworkMorph>
            <span className={b("chip")}>
              <span className={b("chip-dot")} />
              <span className={b("chip-text")}>{t.title}</span>
            </span>
          </WorkLink>
        ))}
      </div>
    </section>
  );
}
