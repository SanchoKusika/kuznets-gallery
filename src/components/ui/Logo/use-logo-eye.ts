import { useEffect, type RefObject } from "react";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { LOGO_INTRO_ATTR, LOGO_INTRO_MS } from "./logo-intro";

/** How far the dot may leave the centre of the «O», in logo units (the counter's radius is ~28, the dot's ~9). */
const REACH = 13;
/** Pointer distance (px) at which the dot looks fully aside; closer, it looks less far. */
const NEAR = 220;
/** Logo units per 1 px of rendered height (the canvas is 192 units tall). */
const UNITS = 192;

/**
 * The live header logo: the orange dot follows the mouse like a pupil (eased, only while it moves),
 * the «O» blinks on press, and the first-visit build ends by dropping `html[data-logo-intro]`.
 */
export function useLogoEye(ref: RefObject<SVGSVGElement | null>, enabled: boolean) {
  useEffect(() => {
    const svg = ref.current;
    if (!enabled || !svg) return;

    const root = document.documentElement;
    const intro = root.hasAttribute(LOGO_INTRO_ATTR) ? window.setTimeout(() => root.removeAttribute(LOGO_INTRO_ATTR), LOGO_INTRO_MS) : 0;
    if (!prefersMotion()) return () => clearTimeout(intro);

    const dot = svg.querySelector<SVGPathElement>("[data-logo-dot]")!;
    const o = svg.querySelector<SVGPathElement>("[data-logo-o]")!;

    const blink = () => {
      o.animate({ scale: ["1", "1 0.08", "1"] }, { duration: 260, easing: "ease-in-out" });
      dot.animate({ opacity: [1, 0, 0, 1], offset: [0, 0.3, 0.6, 1] }, { duration: 260 });
    };
    svg.addEventListener("pointerdown", blink);

    // Pointer position; null — the mouse left the window, the eye looks straight ahead.
    let pointer: { x: number; y: number } | null = null;
    let x = 0;
    let y = 0;
    let raf = 0;

    const target = () => {
      const r = dot.getBoundingClientRect();
      if (!pointer || !r.width) return { tx: 0, ty: 0 };
      const k = svg.getBoundingClientRect().height / UNITS;
      const dx = pointer.x - (r.left + r.width / 2 - x * k);
      const dy = pointer.y - (r.top + r.height / 2 - y * k);
      const d = Math.hypot(dx, dy) || 1;
      const reach = REACH * Math.min(1, d / NEAR);
      return { tx: (dx / d) * reach, ty: (dy / d) * reach };
    };

    const tick = () => {
      const { tx, ty } = target();
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      dot.style.translate = `${x}px ${y}px`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      kick();
    };
    const onLeave = () => {
      pointer = null;
      kick();
    };

    addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    return () => {
      clearTimeout(intro);
      cancelAnimationFrame(raf);
      svg.removeEventListener("pointerdown", blink);
      removeEventListener("pointermove", onMove);
      root.removeEventListener("mouseleave", onLeave);
    };
  }, [ref, enabled]);
}
