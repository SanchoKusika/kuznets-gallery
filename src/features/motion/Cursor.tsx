"use client";

import { getImageProps } from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { bem } from "@/lib/bem";
import { prefersMotion } from "./prefers-motion";
import s from "./Cursor.module.scss";

const b = bem(s, "cursor");
const BIG = s["cursor__dot--big"];
const SHOWN = s["cursor__preview--shown"];

/** Optimised image for the preview well (≤ 280px square). */
function previewImage(src: string) {
  const { props } = getImageProps({ src, alt: "", width: 280, height: 280, sizes: "min(280px, 22vw)" });
  return props;
}

/**
 * Mouse-only cursor (prototype `initCursor`): an accent dot that grows to 96px with a label over
 * `[data-cursor]`, and a floating, tilting preview over `[data-preview]`. The element under the
 * pointer is looked up again after scrolling, clicks and page changes without mouse movement;
 * touch/pen input, leaving the window and blur hide it. Only with `(any-pointer: fine)` and motion.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const probeRef = useRef<() => void>(null);
  const pathname = usePathname();

  useEffect(() => {
    const dot = dotRef.current;
    const label = labelRef.current;
    const preview = previewRef.current;
    const img = imgRef.current;
    if (!dot || !label || !preview || !img || !matchMedia("(any-pointer: fine)").matches || !prefersMotion()) return;

    let x = -100;
    let y = -100;
    let cx = x;
    let cy = y;
    let px = x;
    let py = y;
    let text: string | null = null;
    let src: string | null = null;
    let live = false;
    let probing = 0;
    let raf = 0;

    const apply = (target: EventTarget | null) => {
      const el = live && target instanceof Element ? target : null;
      const nextText = el?.closest("[data-cursor]")?.getAttribute("data-cursor") ?? "";
      if (nextText !== text) {
        text = nextText;
        label.textContent = nextText;
        dot.classList.toggle(BIG, !!nextText);
      }
      const nextSrc = el?.closest("[data-preview]")?.getAttribute("data-preview") ?? "";
      if (nextSrc !== src) {
        src = nextSrc;
        if (nextSrc) {
          const p = previewImage(nextSrc);
          img.sizes = p.sizes ?? "";
          img.srcset = p.srcSet ?? "";
          img.src = p.src;
          px = x;
          py = y;
        }
        preview.classList.toggle(SHOWN, !!nextSrc);
      }
    };
    const off = () => {
      if (!live && !text && !src) return;
      live = false;
      apply(null);
    };
    const probe = () => {
      if (probing || !live) return;
      probing = requestAnimationFrame(() => {
        probing = 0;
        if (live) apply(document.elementFromPoint(x, y));
      });
    };
    probeRef.current = probe;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return off();
      live = true;
      x = e.clientX;
      y = e.clientY;
      apply(e.target);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") off();
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) off();
    };

    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      px += (x - px) * 0.09;
      py += (y - py) * 0.09;
      dot.style.transform = `translate(${cx}px,${cy}px)`;
      const tilt = Math.max(-10, Math.min(10, (x - px) * 0.06));
      preview.style.transform = `translate(${px + 40}px,${py}px) translate(0,-50%) rotate(${tilt}deg)`;
      raf = requestAnimationFrame(loop);
    };

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("scroll", probe, { passive: true, capture: true });
    addEventListener("click", probe);
    document.addEventListener("mouseout", onOut);
    addEventListener("blur", off);
    loop();

    return () => {
      probeRef.current = null;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(probing);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      removeEventListener("scroll", probe, { capture: true });
      removeEventListener("click", probe);
      document.removeEventListener("mouseout", onOut);
      removeEventListener("blur", off);
    };
  }, []);

  // A new page under a still mouse: look the element up again.
  useEffect(() => probeRef.current?.(), [pathname]);

  return (
    <div className={b()} aria-hidden="true">
      <div ref={previewRef} className={b("preview")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- src/srcset come from getImageProps() */}
        <img ref={imgRef} alt="" className={b("preview-img")} />
      </div>
      <div ref={dotRef} className={b("dot")}>
        <span ref={labelRef} />
      </div>
    </div>
  );
}
