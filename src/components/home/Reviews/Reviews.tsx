"use client";

import { useEffect, useRef, useState, type PointerEvent, type TouchEvent } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import { bem } from "@/lib/bem";
import s from "./Reviews.module.scss";

const b = bem(s, "reviews");

type Review = { n: string; q: string };

/**
 * Review slider: auto-advances every 5s while ≥40% of the block is visible,
 * pauses under the mouse, swipes on touch (>40px).
 */
export function Reviews({ reviews }: { reviews: readonly Review[] }) {
  const total = reviews.length;
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const touchX = useRef<number | null>(null);

  const go = (step: number) => setIndex((i) => (i + step + total) % total);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        setVisible(e.isIntersecting && e.intersectionRatio >= 0.4);
      },
      { threshold: [0, 0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Any slide change re-arms the timer (prototype `revArm`).
  useEffect(() => {
    if (!visible || hovered || total < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearTimeout(t);
  }, [index, visible, hovered, total]);

  const onHover = (on: boolean) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHovered(on);
  };
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchX.current;
    const end = e.changedTouches[0]?.clientX;
    touchX.current = null;
    if (start == null || end == null) return;
    const dx = end - start;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      ref={sectionRef}
      className={b()}
      onPointerEnter={onHover(true)}
      onPointerLeave={onHover(false)}
      data-reveal
    >
      <div className={b("head")}>
        <h2 className={b("title")}>Что пишут клиенты</h2>
        <div className={b("controls")}>
          <span className={b("counter")}>
            <span className={b("current")}>{index + 1}</span> / {total}
          </span>
          <button type="button" className={b("nav")} aria-label="Предыдущий отзыв" onClick={() => go(-1)}>
            <Icon name="arrow-left" size={18} />
          </button>
          <button type="button" className={b("nav")} aria-label="Следующий отзыв" onClick={() => go(1)}>
            <Icon name="arrow-right" size={18} />
          </button>
        </div>
      </div>
      <div className={b("slides")} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {reviews.map((r, i) => (
          <figure
            key={r.n}
            className={b("slide", { active: i === index, before: i < index, after: i > index })}
            aria-hidden={i !== index}
          >
            <blockquote className={b("quote")}>«{r.q}»</blockquote>
            <figcaption className={b("author")}>— {r.n}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
