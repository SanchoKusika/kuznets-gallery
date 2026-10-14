"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { isScrollLocked } from "./scroll-lock";
import { setLenis } from "./smooth-scroll";

/**
 * Lenis smooth wheel scrolling on the site (not in the admin). Native scroll stays underneath, so
 * `position: sticky` keeps working; touch scrolling stays native; off with reduced motion.
 * Panels that scroll on their own carry `data-lenis-prevent`.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (!prefersMotion()) return;
    const lenis = new Lenis({ autoRaf: true, stopInertiaOnNavigate: true });
    setLenis(lenis);
    if (isScrollLocked()) lenis.stop();
    return () => {
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
