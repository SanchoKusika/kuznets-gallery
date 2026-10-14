"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, type MouseEvent } from "react";
import { CONTACTS } from "@/content/site";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { bem } from "@/lib/bem";
import { routes, type Section } from "@/lib/routes";
import s from "./StaggeredMenu.module.scss";

const b = bem(s, "staggered-menu");

const EASE_OUT_QUART = "cubic-bezier(.22,1,.36,1)";
const EASE_OUT_CUBIC = "cubic-bezier(.33,1,.68,1)";
const EASE_OUT_QUAD = "cubic-bezier(.25,1,.5,1)";
const EASE_CLOSE = "cubic-bezier(.5,0,.75,0)";

type Props = {
  section: Section;
  closing: boolean;
  onClosed: () => void;
  onNavigate: () => void;
  onContacts: (e: MouseEvent) => void;
};

/** Full-screen mobile menu after React Bits "Staggered Menu" (prototype `smOpen` / `smClose`). */
export function StaggeredMenu({ section, closing, onClosed, onNavigate, onContacts }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Open: ink + accent layers, then the paper panel, then the staggered content.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !prefersMotion()) return;
    const q = (name: string) => [...root.querySelectorAll<HTMLElement>(`[data-sm="${name}"]`)];
    const layers = q("layer");
    const panelDelay = Math.max(0, layers.length - 1) * 70 + 80;
    const itemsStart = panelDelay + 650 * 0.15;
    const socialsStart = panelDelay + 650 * 0.4;
    const anims: Animation[] = [];
    const run = (el: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => anims.push(el.animate(kf, { fill: "backwards", ...o }));

    layers.forEach((el, i) =>
      run(el, [{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 500, delay: i * 70, easing: EASE_OUT_QUART }),
    );
    q("panel").forEach((el) =>
      run(el, [{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 650, delay: panelDelay, easing: EASE_OUT_QUART }),
    );
    q("label").forEach((el, i) =>
      run(el, [{ transform: "translateY(140%) rotate(10deg)" }, { transform: "none" }], {
        duration: 1000,
        delay: itemsStart + i * 100,
        easing: EASE_OUT_QUART,
      }),
    );
    q("num").forEach((el, i) =>
      run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: itemsStart + 100 + i * 80, easing: EASE_OUT_CUBIC }),
    );
    q("title").forEach((el) =>
      run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: socialsStart, easing: EASE_OUT_CUBIC }),
    );
    q("link").forEach((el, i) =>
      run(el, [{ opacity: 0, transform: "translateY(25px)" }, { opacity: 1, transform: "none" }], {
        duration: 550,
        delay: socialsStart + 40 + i * 80,
        easing: EASE_OUT_QUAD,
      }),
    );
    return () => anims.forEach((a) => a.cancel());
  }, []);

  // Close: everything slides back out to the right, then the menu unmounts.
  useEffect(() => {
    const root = rootRef.current;
    if (!closing) return;
    if (!root || !prefersMotion()) {
      onClosed();
      return;
    }
    root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    const els = [...root.querySelectorAll('[data-sm="layer"],[data-sm="panel"]')];
    let left = els.length;
    const anims = els.map((el) => {
      const a = el.animate([{ transform: "none" }, { transform: "translateX(100%)" }], {
        duration: 320,
        easing: EASE_CLOSE,
        fill: "forwards",
      });
      a.onfinish = () => {
        if (--left === 0) onClosed();
      };
      return a;
    });
    return () => anims.forEach((a) => (a.onfinish = null));
  }, [closing, onClosed]);

  const items = [
    { label: "главная", href: routes.home, current: section === "home" },
    { label: "коллекция", href: routes.collection(), current: section === "catalog" || section === "work" },
    { label: "покупателям", href: routes.info, current: section === "info" },
  ];

  return (
    <div ref={rootRef} className={b(null, { closing })} data-lenis-prevent>
      <div className={b("layer", { ink: true })} data-sm="layer" />
      <div className={b("layer", { accent: true })} data-sm="layer" />
      <div className={b("panel")} data-sm="panel">
        <nav className={b("nav")} aria-label="Меню">
          {items.map((item, i) => (
            <div key={item.href} className={b("item")}>
              <Link href={item.href} className={b("link", { current: item.current })} onClick={onNavigate}>
                <span className={b("label")} data-sm="label">
                  {item.label}
                </span>
                <span className={b("num")} data-sm="num">
                  0{i + 1}
                </span>
              </Link>
            </div>
          ))}
          <div className={b("item")}>
            <a href="#contacts" className={b("link")} onClick={onContacts}>
              <span className={b("label")} data-sm="label">
                контакты
              </span>
              <span className={b("num")} data-sm="num">
                04
              </span>
            </a>
          </div>
        </nav>
        <div className={b("contact")}>
          <span className={b("contact-title")} data-sm="title">
            Связаться
          </span>
          <div className={b("contact-links")}>
            {CONTACTS.phones.map((p) => (
              <a key={p.href} href={p.href} className={b("contact-link")} data-sm="link">
                {p.label} · {p.name}
              </a>
            ))}
            <a href={CONTACTS.instagram.href} className={b("contact-link")} data-sm="link">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
