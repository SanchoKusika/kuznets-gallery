"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon/Icon";
import { prefersMotion } from "@/features/motion/prefers-motion";
import { useOrder } from "@/features/order/store";
import { isScrollLocked, lockScroll, unlockScroll } from "@/features/scroll/scroll-lock";
import { bem } from "@/lib/bem";
import { useMediaQuery } from "@/lib/use-media-query";
import { GridMotion, type GridTile } from "./GridMotion";
import s from "./Meditation.module.scss";
import { meditation, useMeditationOpen } from "./store";

const b = bem(s, "meditation");

/** Physical keyboard and mouse: the mode starts from the M key, which a phone doesn't have. */
const DESKTOP = "(hover: hover) and (pointer: fine)";
/** The pointer hides, and the controls fade, after this long without moving, ms. */
const IDLE_MS = 2600;
/** Leaving fades the mode out for this long, ms (as long as the CSS fade). */
const LEAVE_MS = 450;

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** A new order of the pictures every time the mode opens (Fisher–Yates). */
function shuffled<T>(list: T[]) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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
 * the page and leaves the collection's pictures drifting past in tilted rows, the pointer lighting the
 * ones around it (see GridMotion). A click on a picture opens that work; Esc or M leave.
 * `works` — a sample of the catalogue, from the server.
 */
export function Meditation({ works }: { works: GridTile[] }) {
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

  return open ? createPortal(<Stage works={works} />, document.body) : null;
}

function Stage({ works }: { works: GridTile[] }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [tiles] = useState(() => shuffled(works));
  const stageRef = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);

  const leave = (then?: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    const done = () => {
      meditation.close();
      then?.();
    };
    if (!prefersMotion()) return done();
    setClosing(true);
    setTimeout(done, LEAVE_MS);
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

  // The pointer hides, and the controls fade, when it stands still.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let idle = 0;
    const wake = () => {
      stage.classList.remove(s["meditation--idle"]);
      clearTimeout(idle);
      idle = window.setTimeout(() => stage.classList.add(s["meditation--idle"]), IDLE_MS);
    };
    wake();
    addEventListener("pointermove", wake, { passive: true });
    return () => {
      removeEventListener("pointermove", wake);
      clearTimeout(idle);
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
      <GridMotion tiles={tiles} motion={prefersMotion()} onOpen={(href) => leave(() => router.push(href))} />
      <div className={b("vignette")} />
      <div className={b("controls")}>
        <button type="button" className={b("exit")} onClick={() => leave()}>
          <Icon name="close" size={16} />
          Выйти
          <kbd className={b("key")}>Esc</kbd>
        </button>
        <span className={b("hint")}>Ведите мышью — свет идёт за ней · клик по картине открывает работу</span>
      </div>
    </div>
  );
}
