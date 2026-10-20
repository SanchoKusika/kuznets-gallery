"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { bem } from "@/lib/bem";
import { pictureRect } from "@/lib/picture-rect";
import s from "./ArtworkMorphBack.module.scss";

const b = bem(s, "morph-back");

/** Same as the forward morph (globals.scss `.morph`). */
const DURATION = 550;
const EASE = "cubic-bezier(.22,1,.36,1)";
/** Give up if the page we go back to hasn't shown up by then, ms. */
const GIVE_UP_MS = 3000;

/** "/work/kz-001" → "kz-001". */
const workSlug = (pathname: string) => pathname.match(/^\/work\/([^/]+)/)?.[1];

const px = (r: DOMRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

type Flight = { slug: string; box: HTMLDivElement; from: DOMRect; timer: number; card?: HTMLElement };

/**
 * Back from an artwork page (the browser's button or «← Коллекция»): the photo flies back into its
 * card, closing down from the whole picture to the card's crop — the forward morph in reverse.
 * History navigations in Next.js carry no view-transition type (and the page is already swapped
 * by popstate), so this one is a plain overlay, like the flight into «Заявка»: when the traversal
 * starts, a copy of the photo is laid over it; once the page we return to is shown and scrolled
 * back into place, the copy flies to the card and the card takes over.
 */
export function ArtworkMorphBack() {
  const pathname = usePathname();
  const flight = useRef<Flight | null>(null);

  useEffect(() => {
    const drop = () => {
      const f = flight.current;
      if (!f) return;
      clearTimeout(f.timer);
      f.box.remove();
      f.card?.classList.remove(b("target"));
      flight.current = null;
    };
    // Navigation API: fires before the router swaps the page (by popstate it is already hidden).
    const onNavigate = (e: Event) => {
      if ((e as Event & { navigationType?: string }).navigationType !== "traverse") return;
      drop();
      // The page being left is the one on screen; a page kept hidden for later (Activity) has an empty box.
      const photo = [...document.querySelectorAll<HTMLElement>("[data-artwork-photo]")].find((el) => el.getBoundingClientRect().width > 0);
      const slug = photo?.dataset.artworkPhoto;
      const img = photo?.querySelector<HTMLImageElement>("img:last-of-type");
      if (!slug || !img?.complete || !prefersMotion()) return;
      const box = document.createElement("div");
      box.className = b();
      const from = pictureRect(img);
      Object.assign(box.style, px(from));
      const copy = document.createElement("img");
      copy.className = b("img");
      copy.src = img.currentSrc || img.src;
      copy.alt = "";
      box.append(copy);
      document.body.append(box);
      flight.current = { slug, box, from, timer: window.setTimeout(drop, GIVE_UP_MS) };
    };
    // Without the Navigation API (older Safari and Firefox) back simply has no flight.
    const nav = (window as Window & { navigation?: EventTarget }).navigation;
    nav?.addEventListener("navigate", onNavigate);
    return () => {
      nav?.removeEventListener("navigate", onNavigate);
      drop();
    };
  }, []);

  // The page we went back to is committed: fly once the browser has restored its scroll position.
  useLayoutEffect(() => {
    const f = flight.current;
    if (!f || workSlug(pathname) === f.slug) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (flight.current !== f) return;
        clearTimeout(f.timer);
        const card = [...document.querySelectorAll<HTMLImageElement>(`a[href="/work/${f.slug}"] img`)]
          .map((img) => img.parentElement!)
          .find((media) => {
            const r = media.getBoundingClientRect();
            return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
          });
        // Until it lands the flight stays current, so a new Back or unmounting cleans it up (drop).
        const land = () => {
          f.card?.classList.remove(b("target"));
          f.box.remove();
          if (flight.current === f) flight.current = null;
        };
        if (!card) {
          f.box.animate({ opacity: [1, 0] }, { duration: 200 }).finished.then(land, land);
          return;
        }
        f.card = card;
        card.classList.add(b("target"));
        const fly = f.box.animate([px(f.from), px(card.getBoundingClientRect())], { duration: DURATION, easing: EASE, fill: "forwards" });
        fly.finished.then(land, land);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
