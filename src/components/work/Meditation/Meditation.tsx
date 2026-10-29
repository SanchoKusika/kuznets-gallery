"use client";

import { getImageProps } from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon/Icon";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { useOrder } from "@/features/order/store";
import { lockScroll, unlockScroll } from "@/features/scroll/scroll-lock";
import { bem } from "@/lib/bem";
import { isForeign } from "@/lib/images";
import { useMediaQuery } from "@/lib/use-media-query";
import { createDust } from "./dust";
import s from "./Meditation.module.scss";

const b = bem(s, "meditation");

/** A work in the meditation mode: the picture alone (the flat photo, else the catalogue one). */
export type MeditationWork = { code: string; href: string; title: string; src: string; range: string };

/** Physical keyboard and mouse: the mode starts from the M key, which a phone doesn't have. */
const DESKTOP = "(hover: hover) and (pointer: fine)";
/** The pointer hides, and the controls fade, after this long without moving, ms. */
const IDLE_MS = 2600;
/** The picture fades out for this long before the next one comes, ms. */
const FADE_MS = 380;
/** Leaving fades the mode out for this long, ms (as long as the CSS fade). */
const LEAVE_MS = 450;
/** Wheel turns closer than this are one gesture, ms. */
const WHEEL_MS = 700;

/** The image as the optimizer serves it, for the <img> and for preloading the neighbours alike. */
function paintingImage(src: string) {
  return getImageProps({ src, alt: "", width: 1600, height: 1600, sizes: "78vw", unoptimized: isForeign(src) }).props;
}

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * «Режим медитации», desktop only: the M key (or the link in the breadcrumbs) hides the site and leaves
 * the picture alone on a dark plaster wall under a slowly breathing lamp, with specks of dust in its
 * light. ← → (or the wheel) turn to the next works in the catalogue, Enter opens the shown one, Esc or
 * M leaves. `works[0]` is the page's own work.
 */
export function Meditation({ works }: { works: MeditationWork[] }) {
  const desktop = useMediaQuery(DESKTOP);
  const { drawerOpen } = useOrder();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!desktop || open || drawerOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.code !== "KeyM" || e.repeat || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      setOpen(true);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [desktop, open, drawerOpen]);

  return (
    <>
      <button type="button" className={b("trigger")} onClick={() => setOpen(true)}>
        <kbd className={b("key")}>M</kbd>
        Режим медитации
      </button>
      {open && createPortal(<Stage works={works} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function Stage({ works, onClose }: { works: MeditationWork[]; onClose: () => void }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  /** The picture on show once its image has loaded: the image's ratio sizes the frame. */
  const [shown, setShown] = useState<{ code: string; ratio: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);
  const leaving = useRef(false);
  const lastWheel = useRef(0);
  const work = works[index];

  const leave = (then?: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    const done = () => {
      onClose();
      then?.();
    };
    if (!prefersMotion()) return done();
    setClosing(true);
    setTimeout(done, LEAVE_MS);
  };

  const step = async (dir: 1 | -1) => {
    if (busy.current || leaving.current || works.length < 2) return;
    busy.current = true;
    if (prefersMotion()) {
      await frameRef.current?.animate({ opacity: [1, 0], scale: [1, 0.985] }, { duration: FADE_MS, easing: "ease-in", fill: "forwards" }).finished;
    }
    // A page turn doesn't hold up leaving: the picture just stays faded out under the closing fade.
    if (!leaving.current) setIndex((i) => (i + dir + works.length) % works.length);
    busy.current = false;
  };

  /** The image has arrived: show it, framed by its own ratio (once — the ref callback runs on every render). */
  const markShown = (img: HTMLImageElement) =>
    setShown((prev) => (prev?.code === work.code ? prev : { code: work.code, ratio: img.naturalWidth / img.naturalHeight }));

  const openWork = () => leave(index === 0 ? undefined : () => router.push(work.href));

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

  // The next and the previous pictures are fetched ahead, so turning to them is quick.
  useEffect(() => {
    for (const w of [works[(index + 1) % works.length], works[(index - 1 + works.length) % works.length]]) {
      const p = paintingImage(w.src);
      const img = new Image();
      img.sizes = p.sizes ?? "";
      img.srcset = p.srcSet ?? "";
      img.src = p.src;
    }
  }, [index, works]);

  // The idle pointer, the pointer parallax and the drifting dust; the last two are off with reduced motion.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let idle = 0;
    const wake = () => {
      stage.classList.remove(s["meditation--idle"]);
      clearTimeout(idle);
      idle = window.setTimeout(() => stage.classList.add(s["meditation--idle"]), IDLE_MS);
    };
    wake();
    addEventListener("pointermove", wake, { passive: true });
    const stopIdle = () => {
      removeEventListener("pointermove", wake);
      clearTimeout(idle);
    };
    if (!prefersMotion()) return stopIdle;

    const dust = createDust(canvas);
    const fit = () => dust.resize(stage.clientWidth, stage.clientHeight);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);

    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener("pointermove", onMove, { passive: true });
    const loop = (time: number) => {
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      stage.style.setProperty("--mx", mx.toFixed(4));
      stage.style.setProperty("--my", my.toFixed(4));
      dust.frame(time, mx, my);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      stopIdle();
      cancelAnimationFrame(raf);
      observer.disconnect();
      removeEventListener("pointermove", onMove);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      // Three buttons and nothing else to reach: Tab goes round them.
      const buttons = [...e.currentTarget.querySelectorAll("button")];
      const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
      buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "Escape" || (e.code === "KeyM" && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey)) leave();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) openWork();
    else return;
    e.preventDefault();
  };

  const image = paintingImage(work.src);

  return (
    <div
      ref={stageRef}
      className={b(null, { closing })}
      role="dialog"
      aria-modal="true"
      aria-label={`Режим медитации: ${work.title}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onWheel={(e) => {
        if (e.timeStamp - lastWheel.current < WHEEL_MS || Math.abs(e.deltaY) < 8) return;
        lastWheel.current = e.timeStamp;
        step(e.deltaY > 0 ? 1 : -1);
      }}
    >
      <div className={b("wall")} />
      <div className={b("light")}>
        <div className={b("glow")} />
      </div>
      <div className={b("vignette")} />

      <div className={b("scene")}>
        <div
          ref={frameRef}
          key={work.code}
          className={b("frame", { lit: shown?.code === work.code })}
          style={{ "--ratio": shown?.code === work.code ? shown.ratio : 1 } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- src/srcset come from getImageProps(), the same ones the preloading uses */}
          <img
            {...image}
            alt={work.title}
            className={b("painting")}
            draggable={false}
            ref={(img) => {
              if (img?.complete && img.naturalWidth) markShown(img);
            }}
            onLoad={(e) => markShown(e.currentTarget)}
          />
          <span className={b("sheen")} />
        </div>
      </div>

      <canvas ref={canvasRef} className={b("dust")} aria-hidden="true" />

      <div key={`plaque-${work.code}`} className={b("plaque")} aria-live="polite">
        <span className={b("plaque-code")}>
          {work.code} · {index + 1} / {works.length}
        </span>
        <span className={b("plaque-title")}>«{work.title}»</span>
        <span className={b("plaque-size")}>{work.range}</span>
      </div>

      <div className={b("controls")}>
        <button type="button" className={b("arrow", { prev: true })} aria-label="Предыдущая работа" onClick={() => step(-1)}>
          <Icon name="arrow-left" size={22} />
        </button>
        <button type="button" className={b("arrow", { next: true })} aria-label="Следующая работа" onClick={() => step(1)}>
          <Icon name="arrow-right" size={22} />
        </button>
        <button type="button" className={b("exit")} onClick={() => leave()}>
          <Icon name="close" size={16} />
          Выйти
          <kbd className={b("key")}>Esc</kbd>
        </button>
        <span className={b("hint")}>← → листать · Enter — открыть работу</span>
      </div>
    </div>
  );
}
