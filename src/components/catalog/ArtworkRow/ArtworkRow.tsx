import Link from "next/link";
import { Media } from "@/components/ui/Media/Media";
import { bem } from "@/lib/bem";
import type { ArtworkCard } from "@/lib/catalog";
import s from "./ArtworkRow.module.scss";

const b = bem(s, "artwork-row");

/** Collection list view row (≥900px): code, thumb, title, description, sizes, price. */
export function ArtworkRow({ card }: { card: ArtworkCard }) {
  return (
    <Link href={card.href} className={b()} data-reveal data-preview={card.src}>
      <span className={b("code")}>{card.code}</span>
      <Media src={card.src} sizes="88px" className={b("thumb")} imgClassName={b("img")} />
      <span className={b("title")}>{card.title}</span>
      <span className={b("desc")}>{card.description}</span>
      <span className={b("sizes")}>{card.sizesText}</span>
      <span className={b("price")}>{card.from}</span>
    </Link>
  );
}
