"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { prefersMotion } from "@/features/motion/prefers-motion";

/** Resting tilt of the frame, degrees (prototype `REST`). */
const REST = 6;
/** The prototype steps its physics once per frame; here a fixed 60 Hz step keeps any display at that pace. */
const STEP_MS = 1000 / 60;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Frame swinging on its nail (prototype 404): `v += (rest − a) · .018; v *= .968`. It can be pulled
 * (±40° around the nail), a mouse moving near it nudges it, "Поправить раму" sets rest to 0 and
 * 2.2s later it slips to 3–9° (one time in five the other way). Static at `rest` with reduced motion.
 * The angle goes to `frame.style.transform` (every frame while it swings).
 */
export function usePendulum(slotRef: RefObject<HTMLElement | null>, frameRef: RefObject<HTMLElement | null>, grabbingClass: string) {
  const state = useRef({ a: REST, v: 0, rest: REST, drag: false, calm: false });
  const slipTimer = useRef(0);

  const paint = () => {
    const s = state.current;
    if (frameRef.current) frameRef.current.style.transform = `rotate(${(s.calm ? s.rest : s.a).toFixed(2)}deg)`;
  };

  /** Angle of the pointer around the nail (.2em above the slot). */
  const angleAt = (x: number, y: number) => {
    const slot = slotRef.current;
    if (!slot) return state.current.a;
    const r = slot.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(slot).fontSize) || 200;
    const nx = r.left + r.width / 2;
    const ny = r.top - fontSize * 0.2;
    return clamp((-Math.atan2(x - nx, Math.max(8, y - ny)) * 180) / Math.PI, -40, 40);
  };

  useEffect(() => {
    const s = state.current;
    s.calm = !prefersMotion();
    const release = () => {
      if (!s.drag) return;
      s.drag = false;
      frameRef.current?.classList.remove(grabbingClass);
      s.v = clamp(s.v, -4, 4);
    };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      const a = angleAt(e.clientX, e.clientY);
      s.v = a - s.a;
      s.a = a;
      if (s.calm) paint();
    };
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", release);
    addEventListener("pointercancel", release);

    let raf = 0;
    let last = 0;
    let pending = 0;
    const tick = (now: number) => {
      pending += last ? Math.min(now - last, 100) : STEP_MS;
      last = now;
      for (; pending >= STEP_MS; pending -= STEP_MS) {
        if (s.drag) continue;
        s.v += (s.rest - s.a) * 0.018;
        s.v *= 0.968;
        s.a += s.v;
      }
      paint();
      raf = requestAnimationFrame(tick);
    };
    if (!s.calm) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(slipTimer.current);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", release);
      removeEventListener("pointercancel", release);
    };
    // Refs and the class name are stable for the page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    grab: (e: ReactPointerEvent<HTMLElement>) => {
      e.preventDefault();
      state.current.drag = true;
      e.currentTarget.classList.add(grabbingClass);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    /** Mouse moving close to the frame gives it a push. */
    nudge: (e: ReactPointerEvent<HTMLElement>) => {
      const s = state.current;
      const slot = slotRef.current;
      if (s.drag || s.calm || e.pointerType !== "mouse" || !slot) return;
      const r = slot.getBoundingClientRect();
      if (e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top - 60 || e.clientY > r.bottom + 20) return;
      s.v -= clamp(e.movementX || 0, -30, 30) * 0.012;
    },
    straighten: () => {
      const s = state.current;
      clearTimeout(slipTimer.current);
      s.rest = 0;
      paint();
      slipTimer.current = window.setTimeout(() => {
        s.rest = (3 + Math.random() * 6) * (Math.random() < 0.2 ? -1 : 1);
        s.v += s.rest > 0 ? 0.5 : -0.5;
        paint();
      }, 2200);
    },
    /** A new picture makes the frame swing. */
    kick: (dv: number) => {
      state.current.v += dv;
    },
  };
}
