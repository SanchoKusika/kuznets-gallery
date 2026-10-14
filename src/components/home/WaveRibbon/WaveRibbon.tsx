"use client";

import { useEffect, useId, useRef, useState } from "react";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { bem } from "@/lib/bem";
import { RIBBON } from "./geometry";
import s from "./WaveRibbon.module.scss";

const b = bem(s, "wave-ribbon");

const SEPARATOR = " ✦ ";
/** Prototype loopSpeed 60, direction "forward": 60/55 viewBox units per 60 Hz frame, leftwards. */
const SPEED = 60 / 55;
const FRAME_MS = 1000 / 60;

/** viewBox width follows the element, clamped to 600–1440 so text stays readable on phones. */
const viewBoxWidth = (el: HTMLElement) => Math.round(Math.max(600, Math.min(1440, el.clientWidth || 1440)));

/** Sine wave spanning 22% past both edges, 2.6 periods (prototype `initLoops`, shape "wave"). */
function wavePath(vb: number) {
  const x0 = -Math.round(vb * 0.22);
  const x1 = Math.round(vb * 1.22);
  const period = (x1 - x0) / 2.6;
  let d = "";
  for (let x = x0; x <= x1; x += 8) {
    const y = RIBBON.cy + Math.sin(((x - x0) / period) * Math.PI * 2) * RIBBON.amplitude;
    d += `${x === x0 ? "M" : "L"}${x},${y.toFixed(1)}`;
  }
  return d;
}

/** Accent ribbon with artwork titles running along a sine wave (SVG textPath). */
export function WaveRibbon({ titles }: { titles: string[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const spanRef = useRef(0);
  const [vb, setVb] = useState<number | null>(null);
  const pathId = "kzc" + useId().replace(/[^\w-]/g, "");
  const one = titles.map((t) => t.toUpperCase()).join(SEPARATOR) + SEPARATOR;

  // Rebuild only when the width changes noticeably (prototype: ≥ 40 units).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setVb((prev) => {
        const next = viewBoxWidth(el);
        return prev !== null && Math.abs(next - prev) < 40 ? prev : next;
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fill the path with enough copies of the title line (re-measured once fonts load).
  useEffect(() => {
    const tp = textPathRef.current;
    if (!tp || vb === null) return;
    tp.textContent = one.repeat(4);
    const measure = () => {
      const span = measureRef.current?.getComputedTextLength() ?? 0;
      const length = pathRef.current?.getTotalLength() ?? 0;
      spanRef.current = span;
      if (span) tp.textContent = one.repeat(Math.ceil((length + span) / span) + 1);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [vb, one]);

  // Run the titles along the wave while it is on screen; dragging moves them by hand and turns
  // the run to the drag direction (prototype `tick` / pointer handlers). Static with reduced motion.
  useEffect(() => {
    const el = rootRef.current;
    const tp = textPathRef.current;
    if (!el || !tp || vb === null || !prefersMotion()) return;
    let offset = 0;
    let velocity = -SPEED;
    let dragging = false;
    let lastX = 0;
    let last = 0;
    let raf = 0;

    const tick = (now: number) => {
      const span = spanRef.current;
      const frames = last ? Math.min(now - last, 100) / FRAME_MS : 1;
      last = now;
      if (span) {
        if (!dragging) offset += velocity * frames;
        while (offset <= -span) offset += span;
        while (offset > 0) offset -= span;
        tp.setAttribute("startOffset", `${offset}px`);
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      cancelAnimationFrame(raf);
      last = 0;
      if (entries[entries.length - 1].isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);

    const setDragging = (on: boolean) => {
      dragging = on;
      el.classList.toggle(s["wave-ribbon--dragging"], on);
    };
    const onDown = (e: PointerEvent) => {
      setDragging(true);
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - lastX) * (vb / el.clientWidth);
      lastX = e.clientX;
      offset += dx;
      if (dx) velocity = Math.sign(dx) * SPEED;
    };
    const onUp = () => setDragging(false);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onUp);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onUp);
      setDragging(false);
    };
  }, [vb]);

  return (
    <div ref={rootRef} className={b(null, { ready: vb !== null })} title="Потяните, чтобы изменить направление">
      {vb !== null && (
        <svg className={b("svg")} viewBox={`0 0 ${vb} ${RIBBON.height}`} aria-hidden="true">
          {/* The band is also the path the text runs along. */}
          <path ref={pathRef} id={pathId} className={b("band")} d={wavePath(vb)} strokeWidth={RIBBON.band} />
          <text ref={measureRef} className={b("measure")} x="0" y="-999" fontSize={RIBBON.fontSize}>
            {one}
          </text>
          <text className={b("text")} dominantBaseline="central" fontSize={RIBBON.fontSize}>
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0" />
          </text>
        </svg>
      )}
    </div>
  );
}
