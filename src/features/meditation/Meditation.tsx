"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon/Icon";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { useOrder } from "@/features/order/store";
import { isScrollLocked, lockScroll, unlockScroll } from "@/features/scroll/scroll-lock";
import { bem } from "@/lib/bem";
import { useMediaQuery } from "@/lib/use-media-query";
import s from "./Meditation.module.scss";
import { createSilk } from "./silk";
import { meditation, useMeditationOpen } from "./store";

const b = bem(s, "meditation");

/** Physical keyboard and mouse: the mode starts from the M key, which a phone doesn't have. */
const DESKTOP = "(hover: hover) and (pointer: fine)";
/** The pointer hides, and the controls fade, after this long without moving, ms. */
const IDLE_MS = 2600;
/** Leaving fades the mode out for this long, ms (as long as the CSS fade). */
const LEAVE_MS = 450;
/** Seconds of a breath: in, then out (a little slower out, as in calm breathing). */
const INHALE_S = 4;
const EXHALE_S = 6;
/** Without a pointer the lamp wanders on its own; this long after the last movement it lets go, s. */
const WANDER_AFTER_S = 3;
/** The drawing buffer's share of the screen: the cloth is smooth, so a coarser one costs nothing and spares weak GPUs. */
const SCALE_FROM = 0.8;
const SCALE_LEAST = 0.3;
/** A frame slower than this (ms; 25 fps — a screen held to 30 fps by power saving is not slow) makes the picture coarser once most of `WINDOW` frames are. */
const SLOW_MS = 40;
const WINDOW = 45;

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);

/** The breath at `t` seconds: how full it is (0…1), whether it is going in, and how far into its phase (0…1). */
function breathAt(t: number) {
  const c = t % (INHALE_S + EXHALE_S);
  return c < INHALE_S
    ? { fill: ease(c / INHALE_S), inhale: true, phase: c / INHALE_S }
    : { fill: 1 - ease((c - INHALE_S) / EXHALE_S), inhale: false, phase: (c - INHALE_S) / EXHALE_S };
}

/** «M Режим медитации» link for the work page's breadcrumbs; hidden without a keyboard. */
export function MeditationTrigger() {
  return (
    <button type="button" className={b("trigger")} onClick={meditation.open}>
      <kbd className={b("key")}>M</kbd>
      Режим медитации
    </button>
  );
}

/**
 * «Режим медитации», desktop only: the M key anywhere on the site (or the link on a work page) hides
 * the page and leaves a field of slowly moving satin in the logo's colours, with a lamp that follows
 * the pointer and a ring that breathes in and out for the visitor to breathe with. A click sends a
 * ripple over the cloth. Esc or M leave.
 */
export function Meditation() {
  const desktop = useMediaQuery(DESKTOP);
  const open = useMeditationOpen();
  const { drawerOpen } = useOrder();

  useEffect(() => {
    if (!desktop || open || drawerOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.code !== "KeyM" || e.repeat || e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || isScrollLocked()) return;
      meditation.open();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [desktop, open, drawerOpen]);

  return open ? createPortal(<Stage />, document.body) : null;
}

function Stage() {
  const [closing, setClosing] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const leaving = useRef(false);

  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    if (!prefersMotion()) return meditation.close();
    setClosing(true);
    setTimeout(meditation.close, LEAVE_MS);
  };

  // The page stands still behind the mode; focus moves in and comes back.
  useEffect(() => {
    const before = document.activeElement;
    lockScroll("meditation");
    stageRef.current?.focus();
    return () => {
      unlockScroll("meditation");
      if (before instanceof HTMLElement) before.focus({ preventScroll: true });
    };
  }, []);

  // The cloth, the lamp, the breath and the idle pointer. With reduced motion the cloth is one still frame.
  useEffect(() => {
    const stage = stageRef.current;
    const label = labelRef.current;
    if (!stage || !label) return;

    // A canvas of its own for every run: a WebGL context given back can't be taken again from the same one.
    const canvas = document.createElement("canvas");
    canvas.className = s["meditation__cloth"];
    canvas.setAttribute("aria-hidden", "true");
    stage.prepend(canvas);

    let idle = 0;
    const wake = () => {
      stage.classList.remove(s["meditation--idle"]);
      clearTimeout(idle);
      idle = window.setTimeout(() => stage.classList.add(s["meditation--idle"]), IDLE_MS);
    };
    wake();

    const motion = prefersMotion();
    const silk = createSilk(canvas);
    let scale = SCALE_FROM;
    let clock = 0;
    // A resized canvas is blank, so the frame is drawn again at once, before anything is painted.
    const fit = () => {
      silk?.resize(Math.max(2, Math.round(stage.clientWidth * scale)), Math.max(2, Math.round(stage.clientHeight * scale)));
      silk?.frame(clock);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);

    // Where the pointer is (0…1, y up) and when it last moved, s.
    const pointer = { x: 0.5, y: 0.5, moved: -Infinity };
    const light = { x: 0.5, y: 0.5 };
    const toScreen = (e: PointerEvent) => ({ x: e.clientX / innerWidth, y: 1 - e.clientY / innerHeight });
    const onMove = (e: PointerEvent) => {
      wake();
      Object.assign(pointer, toScreen(e), { moved: clock });
    };
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest("button")) return;
      const at = toScreen(e);
      silk?.ring(at.x, at.y, clock);
      if (!motion) silk?.frame(clock);
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown);

    let raf = 0;
    let last = 0;
    let slow = 0;
    let frames = 0;
    const origin = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000 || 0);
      clock = (now - origin) / 1000;
      // The lamp goes after the pointer; when it has been still a while, it wanders along a slow loop.
      const idleFor = clock - pointer.moved;
      const wander = Math.min(1, Math.max(0, (idleFor - WANDER_AFTER_S) / 2));
      const tx = pointer.x + (0.5 + 0.28 * Math.sin(clock * 0.23) - pointer.x) * wander;
      const ty = pointer.y + (0.5 + 0.2 * Math.sin(clock * 0.31 + 1) - pointer.y) * wander;
      const follow = 1 - Math.exp(-dt * 3);
      light.x += (tx - light.x) * follow;
      light.y += (ty - light.y) * follow;

      const breath = breathAt(clock);
      silk?.set(light, breath.fill);
      silk?.frame(clock);
      stage.style.setProperty("--breath", breath.fill.toFixed(4));
      const word = breath.inhale ? "Вдох" : "Выдох";
      if (label.textContent !== word) label.textContent = word;
      // The word fades in and out within its phase.
      label.style.opacity = String(Math.min(1, breath.phase * 6, (1 - breath.phase) * 6));

      // A slow screen gets a coarser picture.
      if (last && now - last > SLOW_MS * 4) slow += 4;
      else if (last && now - last > SLOW_MS) slow++;
      if (++frames === WINDOW) {
        if (slow > WINDOW * 0.6 && scale > SCALE_LEAST) {
          scale = Math.max(SCALE_LEAST, scale * 0.8);
          fit();
        }
        frames = 0;
        slow = 0;
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    if (motion) raf = requestAnimationFrame(loop);
    else {
      // Still: a pleasing moment of the cloth, the lamp in the middle, the breath half full.
      clock = 6;
      silk?.set(light, 0.55);
      silk?.frame(clock);
      stage.style.setProperty("--breath", "0.55");
      label.textContent = "Дышите спокойно";
      label.style.opacity = "1";
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      observer.disconnect();
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      silk?.destroy();
      canvas.remove();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" || (e.code === "KeyM" && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey)) leave();
    // Nothing but the exit button to reach: Tab stays on it.
    else if (e.key === "Tab") e.currentTarget.querySelector("button")?.focus();
    else return;
    e.preventDefault();
  };

  return (
    <div ref={stageRef} className={b(null, { closing })} role="dialog" aria-modal="true" aria-label="Режим медитации" tabIndex={-1} onKeyDown={onKeyDown}>
      <div className={b("grain")} />
      <div className={b("breath")} aria-hidden="true">
        <div className={b("ring")} />
        <span ref={labelRef} className={b("word")} />
      </div>
      <div className={b("controls")}>
        <button type="button" className={b("exit")} onClick={leave}>
          <Icon name="close" size={16} />
          Выйти
          <kbd className={b("key")}>Esc</kbd>
        </button>
        <span className={b("hint")}>Дышите вместе со светом · клик — рябь по шёлку</span>
      </div>
    </div>
  );
}
