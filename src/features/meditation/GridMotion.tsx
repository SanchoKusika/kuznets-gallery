"use client";

import { getImageProps } from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { bem } from "@/lib/bem";
import { isForeign } from "@/lib/images";
import { isPlainClick } from "@/lib/plain-click";
import s from "./GridMotion.module.scss";

const b = bem(s, "grid-motion");

/** A picture in the grid and the page it opens. */
export type GridTile = { src: string; href: string };

const ROWS = 5;
/** Width over height of a tile: the collection's 4:5 card. */
const ASPECT = 0.8;
const GAP = 14;
/** The whole plane is turned by this, deg. */
const ANGLE = -12;
/** Drift of a row, px/s; each row has its own pace and the rows go in turns left and right. */
const SPEED = 22;
const PACE = [1, 0.86, 1.12, 0.94, 1.05];
/** How far the pointer pushes the rows, in tile widths, and how slowly a row follows (s). */
const PARALLAX = 0.6;
const INERTIA = [0.42, 0.32, 0.26, 0.22, 0.36];
/** The light round the pointer reaches this many tiles; further out, tiles are dimmed. */
const REACH = 2.4;
/** Seconds the pointer may be still before the light starts wandering on its own. */
const WANDER_AFTER_S = 3;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrap = (v: number, total: number) => ((v % total) + total) % total;
const smoothstep = (edge0: number, edge1: number, v: number) => {
  const t = clamp((v - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** The plane is a little bigger than the screen, turned by ANGLE, so that its corners still cover it. */
function layoutFor(width: number, height: number) {
  if (!width || !height) return null;
  const turn = (ANGLE * Math.PI) / 180;
  const cos = Math.abs(Math.cos(turn));
  const sin = Math.abs(Math.sin(turn));
  const planeWidth = (width * cos + height * sin) * 1.12;
  const planeHeight = (width * sin + height * cos) * 1.12;
  const tileHeight = Math.max(16, (planeHeight - GAP * (ROWS - 1)) / ROWS);
  const tileWidth = tileHeight * ASPECT;
  const step = tileWidth + GAP;
  const perRow = Math.ceil(planeWidth / step) + 1;
  const period = perRow * step;
  return {
    planeWidth,
    planeHeight,
    tileWidth,
    tileHeight,
    step,
    perRow,
    period,
    // a row is wider than the plane by a period, so that it can slide by one without a gap
    copies: Math.ceil(planeWidth / period) + 1,
    top: (planeHeight - ROWS * tileHeight - (ROWS - 1) * GAP) / 2,
  };
}

/** The tile's picture as the optimizer serves it (a card-sized one, the same as in the collection). */
function tileImage(src: string) {
  return getImageProps({ src, alt: "", width: 400, height: 500, sizes: "300px", unoptimized: isForeign(src) }).props;
}

type Props = {
  tiles: GridTile[];
  /** With reduced motion the grid stands still. */
  motion: boolean;
  onOpen: (href: string) => void;
};

/**
 * A grid of pictures on a plane turned by 12°: the rows drift in turns left and right, the pointer
 * pushes them sideways and lights the pictures around it while the rest are dimmed; still, the
 * light wanders by itself. The idea is ReactBits «Grid Motion», written for this site.
 */
export function GridMotion({ tiles, motion, onOpen }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const phase = useRef<{ offsets: number[]; shifts: number[] }>({ offsets: [], shifts: [] });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const layout = useMemo(() => layoutFor(size.width, size.height), [size]);
  const images = useMemo(() => tiles.map((t) => tileImage(t.src)), [tiles]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const width = Math.round(root.clientWidth);
      const height = Math.round(root.clientHeight);
      setSize((now) => (now.width === width && now.height === height ? now : { width, height }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const plane = planeRef.current;
    if (!root || !plane || !layout) return;

    const rowEls = Array.from(plane.children) as HTMLElement[];
    const tileEls = rowEls.map((row) => Array.from(row.children) as HTMLElement[]);
    /** The light on each tile (0…1, eased) and what was last written to it. */
    const spots = tileEls.map((list) => new Float32Array(list.length));
    // -1: nothing written yet — the first frame writes every tile, over what an earlier run left on it.
    const written = tileEls.map((list) => new Float32Array(list.length).fill(-1));
    // Where the rows have got to survives a resize (the effect runs again), so they don't jump back.
    const { offsets, shifts } = phase.current;
    rowEls.forEach((_, r) => {
      offsets[r] ??= r * layout.step * 0.37;
      shifts[r] ??= 0;
    });

    // The pointer from the middle of the screen, px, and when it last moved, s.
    const pointer = { x: 0, y: 0, moved: -Infinity };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX - innerWidth / 2;
      pointer.y = e.clientY - innerHeight / 2;
      pointer.moved = performance.now() / 1000;
    };
    if (motion) addEventListener("pointermove", onMove, { passive: true });

    const turn = (ANGLE * Math.PI) / 180;
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const reach = REACH * Math.max(layout.tileWidth, layout.tileHeight);
    const halfWidth = size.width / 2 || 1;
    const halfHeight = size.height / 2 || 1;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number, instant = false) => {
      const dt = clamp((now - last) / 1000, 0.001, 0.05);
      last = now;
      const t = now / 1000;

      // The pointer, or — when it has been still a while — a slow loop in its place.
      const wander = motion ? clamp((t - pointer.moved - WANDER_AFTER_S) / 2, 0, 1) : 1;
      const wx = motion ? Math.sin(t * 0.17) * halfWidth * 0.6 : 0;
      const wy = motion ? Math.sin(t * 0.23 + 1) * halfHeight * 0.5 : 0;
      const px = pointer.x + (wx - pointer.x) * wander;
      const py = pointer.y + (wy - pointer.y) * wander;
      // The same point on the turned plane.
      const planeX = px * cos + py * sin;
      const planeY = -px * sin + py * cos;
      const nudge = clamp(px / halfWidth, -1, 1);
      const settle = instant ? 1 : 1 - Math.exp(-dt / 0.22);

      rowEls.forEach((row, r) => {
        const drift = r % 2 ? 1 : -1;
        if (motion) offsets[r] += SPEED * drift * PACE[r % PACE.length] * dt;
        const target = motion ? PARALLAX * layout.tileWidth * nudge * (r % 2 ? -1 : 1) : 0;
        shifts[r] += (target - shifts[r]) * (1 - Math.exp(-dt / INERTIA[r % INERTIA.length]));
        const x = -layout.period + wrap(offsets[r] + shifts[r], layout.period);
        row.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

        const rowY = layout.top + r * (layout.tileHeight + GAP) + layout.tileHeight / 2 - layout.planeHeight / 2;
        const left = x - layout.planeWidth / 2 + layout.tileWidth / 2;
        const list = tileEls[r];
        for (let k = 0; k < list.length; k++) {
          const distance = Math.hypot(left + k * layout.step - planeX, rowY - planeY) / reach;
          const wanted = 1 - smoothstep(0.25, 1, distance);
          spots[r][k] += (wanted - spots[r][k]) * settle;
          // Only a tile whose light has really changed is touched.
          if (Math.abs(spots[r][k] - written[r][k]) > 0.004) {
            written[r][k] = spots[r][k];
            list[k].style.setProperty("--spot", written[r][k].toFixed(3));
          }
        }
      });

      if (motion) raf = requestAnimationFrame((next) => frame(next));
    };
    // Still: one frame is enough, with the light already where it belongs.
    if (motion) raf = requestAnimationFrame((now) => frame(now));
    else frame(performance.now(), true);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
    };
  }, [layout, motion, size]);

  const planeVars = layout
    ? ({
        "--angle": `${ANGLE}deg`,
        "--plane-w": `${layout.planeWidth}px`,
        "--plane-h": `${layout.planeHeight}px`,
        "--tile-w": `${layout.tileWidth}px`,
        "--tile-h": `${layout.tileHeight}px`,
        "--gap": `${GAP}px`,
        "--top": `${layout.top}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div ref={rootRef} className={b()}>
      {layout && tiles.length > 0 && (
        <div ref={planeRef} className={b("plane")} style={planeVars} aria-hidden="true">
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} className={b("row")} style={{ "--r": r } as CSSProperties}>
              {Array.from({ length: layout.copies * layout.perRow }, (_, k) => {
                const i = (r * layout.perRow + (k % layout.perRow)) % tiles.length;
                return (
                  <a
                    key={k}
                    href={tiles[i].href}
                    className={b("tile")}
                    tabIndex={-1}
                    draggable={false}
                    onClick={(e) => {
                      if (!isPlainClick(e)) return;
                      e.preventDefault();
                      onOpen(tiles[i].href);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- src/srcset come from getImageProps() */}
                    <img {...images[i]} alt="" className={b("picture")} draggable={false} decoding="async" />
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
