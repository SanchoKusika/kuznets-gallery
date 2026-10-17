import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { ease, progress, type EaseFn } from "../theme/easing";
import { shadow } from "../theme/tokens";
import { ArtImage } from "./ArtImage";

/**
 * A hung canvas: a w×h box with the one picture shadow, no rounding (brief 5.4). Content (usually
 * ArtSwap) is clipped to it. Position by its top-left; rotation around `origin` (e.g. the nail).
 */
export function ArtFrame({
  x,
  y,
  w,
  h,
  rotate = 0,
  origin,
  children,
  style,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  /** Rotation centre relative to the box's top-left, px. */
  origin?: { x: number; y: number };
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: "hidden",
        boxShadow: shadow.float(Math.max(w, h) / 600),
        rotate: rotate ? `${rotate}deg` : undefined,
        transformOrigin: origin ? `${origin.x}px ${origin.y}px` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Works changing inside a frame: each new one rises from the bottom edge over the previous
 * (`rise` frames, ease.rise) — "change by form", the frame stays.
 */
export function ArtSwap({
  items,
  w,
  h,
  rise,
  easing = ease.rise,
  parentScale,
  fast,
}: {
  /** In order; `at` = frame the work starts rising (the first one may start at −∞ to be there). */
  items: { code: string; at: number }[];
  w: number;
  h: number;
  rise: number;
  easing?: EaseFn;
  parentScale?: number;
  fast?: boolean;
}) {
  const frame = useCurrentFrame();
  let i = 0;
  while (i + 1 < items.length && frame >= items[i + 1].at) i++;
  const p = progress(frame, items[i].at, rise, easing);
  const layers = p < 1 && i > 0 ? [i - 1, i] : [i];
  return (
    <>
      {layers.map((k) => (
        <div key={k} style={{ position: "absolute", inset: 0, translate: k === i ? `0 ${(1 - p) * 100}%` : undefined, overflow: "hidden" }}>
          <ArtImage code={items[k].code} width={w} height={h} parentScale={parentScale} fast={fast} />
        </div>
      ))}
    </>
  );
}
