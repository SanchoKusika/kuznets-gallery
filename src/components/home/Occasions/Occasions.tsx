import gift from "@/assets/images/gift.webp";
import officeCafe from "@/assets/images/office-cafe.webp";
import { Media } from "@/components/ui/Media/Media";
import { bem } from "@/lib/bem";
import s from "./Occasions.module.scss";

const b = bem(s, "occasions");

const ITEMS = [
  {
    img: gift,
    alt: "Подарочная упаковка",
    title: "Подарите картину близким и коллегам",
    text: "Печать на холсте — оригинальный сувенир деловому партнёру или подарок близкому человеку. Обрамлённая в багет, изготовленный нашими мастерами, она примет вид настоящей картины.",
  },
  {
    img: officeCafe,
    alt: "Картина в кафе",
    title: "Украсьте кафе, магазин или офис",
    text: "Магазины, кафе, рестораны, офисы, спортивные залы — любые пространства, где нужно создать атмосферу и придать интерьеру неповторимую индивидуальность.",
  },
];

export function Occasions() {
  return (
    <section className={b()} data-reveal>
      {ITEMS.map((it) => (
        <div key={it.title} className={b("item")}>
          <Media src={it.img} alt={it.alt} sizes="(width >= 900px) 50vw, 100vw" className={b("media")} imgClassName={b("img")} />
          <h3 className={b("title")}>{it.title}</h3>
          <p className={b("text")}>{it.text}</p>
        </div>
      ))}
    </section>
  );
}
