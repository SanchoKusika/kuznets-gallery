"use client";

import { useEffect } from "react";
import { prefersMotion } from "./prefers-motion";

const EASE_OUT = "cubic-bezier(.2,.7,.2,1)";
const EASE_RISE = "cubic-bezier(.16,.84,.24,1)";
const FADE_UP: Keyframe[] = [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }];

/**
 * Scroll reveal (prototype `initReveal`): `[data-reveal]` fades up 24px over .8s as it enters the
 * viewport, 60ms apart within a batch (up to 10); `[data-rise]` («картины») rises from its mask.
 * New content (navigation, "Показать ещё") is picked up by a MutationObserver. The first scan lifts
 * the pre-paint hiding (`html[data-motion]`, see globals.scss): blocks in view are held by their
 * animation by then, the rest wait off screen. Seen elements are tracked outside the DOM, so
 * hydration of later-streamed content isn't disturbed.
 */
export function Reveal() {
  useEffect(() => {
    if (!prefersMotion()) return;
    // Running animations, cancelled if the component goes away (dev remount) before they finish.
    const running = new Set<Animation>();
    const animate = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      const a = el.animate(keyframes, { ...options, fill: "backwards" });
      running.add(a);
      a.onfinish = () => running.delete(a);
    };
    let queued = 0;
    let resetTimer = 0;
    // Elements revealed within 150ms of each other form one staggered batch.
    const nextDelay = () => {
      const delay = Math.min(queued++, 10) * 60;
      clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => (queued = 0), 150);
      return delay;
    };
    const fadeUp = (el: Element) => animate(el, FADE_UP, { duration: 800, delay: nextDelay(), easing: EASE_OUT });

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          fadeUp(e.target);
        }),
      { threshold: 0.06 },
    );

    const seen = new WeakSet<Element>();
    const unseen = (attr: string) =>
      [...document.querySelectorAll(`[${attr}]`)].filter((el) => {
        if (seen.has(el)) return false;
        seen.add(el);
        return true;
      });
    const scan = () => {
      if (document.hidden) return;
      unseen("data-rise").forEach((el) =>
        animate(el, [{ transform: "translateY(105%)" }, { transform: "none" }], { duration: 1300, delay: 150, easing: EASE_RISE }),
      );
      unseen("data-reveal").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) fadeUp(el);
        else io.observe(el);
      });
      document.documentElement.removeAttribute("data-motion");
    };

    let raf = 0;
    const scheduleScan = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    };
    const mo = new MutationObserver(scheduleScan);
    mo.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", scheduleScan);
    scan();

    return () => {
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(resetTimer);
      document.removeEventListener("visibilitychange", scheduleScan);
      running.forEach((a) => a.cancel());
    };
  }, []);

  return null;
}
