"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Media } from "@/components/ui/Media/Media";
import { WorkLink } from "@/components/ui/WorkLink/WorkLink";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { swingStraight } from "@/features/whimsy/crooked-card";
import { bem } from "@/lib/bem";
import type { ArtworkCard as Card } from "@/lib/catalog";
import s from "./ArtworkCard.module.scss";

const b = bem(s, "artwork-card");

/** Both grids — the collection and «Ещё» — have 2 / 3 / 4 / 6 columns (artwork-grid in _mixins.scss). */
const SIZES = "(width >= 1680px) 17vw, (width >= 1100px) 25vw, (width >= 800px) 33vw, 50vw";

/** How long the thank-you plate stays after a crooked picture is put right, ms (see the keyframes). */
const THANKS_MS = 2600;

type Props = {
  card: Card;
  variant?: "grid" | "related";
  /** Hangs crooked: the first click straightens it (easter egg «Поправь картину»), the next one opens the work. */
  crooked?: boolean;
  onStraighten?: () => void;
};

/**
 * Artwork tile, 4:5. `grid` — collection grid (title + code, size range + price);
 * `related` — "Ещё" on the artwork page (title + price).
 */
export function ArtworkCard({ card, variant = "grid", crooked = false, onStraighten }: Props) {
  const grid = variant === "grid";
  const mediaRef = useRef<HTMLDivElement>(null);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (!thanks) return;
    const timer = setTimeout(() => setThanks(false), THANKS_MS);
    return () => clearTimeout(timer);
  }, [thanks]);

  const straighten = (e: MouseEvent) => {
    if (!crooked) return;
    e.preventDefault();
    if (prefersMotion()) swingStraight(mediaRef.current);
    setThanks(true);
    onStraighten?.();
  };

  return (
    <WorkLink href={card.href} className={b(null, { related: !grid })} data-cursor={crooked ? "Поправить" : "Смотреть"} data-reveal={grid || undefined} onClick={straighten}>
      <div className={b("frame")}>
        <Media
          ref={mediaRef}
          src={card.src}
          alt={card.title}
          sizes={SIZES}
          className={b("media", { crooked })}
          imgClassName={b("img")}
        />
        {thanks && (
          <span className={b("thanks")} role="status">
            Спасибо, теперь ровно! Перфекционист спокоен
          </span>
        )}
      </div>
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
