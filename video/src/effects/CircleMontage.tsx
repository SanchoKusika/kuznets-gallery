import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CIRCLES } from "../data/selection";
import { art } from "../data/art";
import { ArtImage, coverCrop, type Crop } from "../primitives/ArtImage";
import { ease, mix, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";
import { color, stroke } from "../theme/tokens";

type Props = {
  /** Works in order; each needs a circle in circles.json. */
  codes: readonly string[];
  /** Circle diameter on screen (R4: 440, P5: 480). */
  diameter: number;
  /** Centre of the circle in composition px. */
  x: number;
  y: number;
  /** The circle opens from a point here (radius 0 → D/2 over ½e, in-out); the first work is inside from the start. */
  openFrom?: number;
  /** First hard cut to the next work (default: openFrom + swapEvery). */
  firstSwap?: number;
  /** Frames between cuts (default 1e). */
  swapEvery?: number;
  /** Mask grows to cover the frame (picture inside does not grow); `children` show inside it, behind the picture. */
  expand?: { from: number; duration: number };
  /** Accent ring width (default Reels 3 px; pass stroke.promo in Promo). */
  strokeWidth?: number;
  /** Ring travel beyond the circle, px. */
  ringTravel?: number;
  /**
   * While the mask grows, the last work leaves the circle and lands as a square tile (centre `x`, `y`, side `size`,
   * the tile's centred crop) — so it does not vanish when the scene cuts to the wall it is part of.
   */
  land?: { from: number; duration: number; x: number; y: number; size: number };
  children?: ReactNode;
};

/**
 * "Change by form" (brief 6.3 CircleMontage, R4 / P5): a fixed circle at (x, y); the work inside changes on a
 * hard cut, each one cropped so its own round motif (circles.json) fills the mask; on every cut an accent ring
 * leaves the circle edge and fades over 1e.
 */
export function CircleMontage({
  codes,
  diameter,
  x,
  y,
  openFrom = 0,
  firstSwap,
  swapEvery,
  expand,
  strokeWidth = stroke.reels,
  ringTravel = 180,
  land,
  children,
}: Props) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { e } = useTiming();
  if (frame < openFrom) return null;

  const every = swapEvery ?? e(1);
  const first = firstSwap ?? openFrom + every;
  const R = diameter / 2;

  // Index of the work on screen: 0 until the first cut, then one more per cut.
  const cuts = frame < first ? 0 : Math.floor((frame - first) / every) + 1;
  const code = codes[cuts % codes.length];
  const c = CIRCLES[code];
  if (!c) throw new Error(`No circle for ${code} in circles.json`);

  // Mask radius: opens from a point, then (optionally) grows to the farthest corner.
  const cover = Math.max(Math.hypot(x, y), Math.hypot(width - x, y), Math.hypot(x, height - y), Math.hypot(width - x, height - y));
  const open = progress(frame, openFrom, e(0.5), ease.inOut);
  const grow = expand ? progress(frame, expand.from, expand.duration, ease.inOut) : 0;
  const mask = grow > 0 ? mix(R, cover, grow) : R * open;

  // Rings of the cuts still alive (each lives 1e).
  const ringLife = e(1);
  const rings = [];
  for (let n = Math.max(1, cuts - Math.ceil(ringLife / every)); n <= cuts; n++) {
    const from = first + (n - 1) * every;
    const t = progress(frame, from, ringLife, ease.out);
    // Fades linearly, so it stays readable while it travels (the eased radius is mostly out after a few frames).
    const fade = progress(frame, from, ringLife, ease.linear);
    if (fade >= 1) continue;
    rings.push(<circle key={n} cx={x} cy={y} r={R + ringTravel * t} fill="none" stroke={color.accent} strokeWidth={strokeWidth} opacity={1 - fade} />);
  }

  const l = land ? progress(frame, land.from, land.duration, ease.inOut) : 0;
  if (land && l > 0) {
    // Circle → tile: centre, size, crop (the round motif → the tile's centred square) and corners all travel.
    const a = art(code);
    const from: Crop = { x: c.cx - c.r, y: c.cy - c.r, w: 2 * c.r, h: 2 * c.r };
    const to = coverCrop(a.w, a.h, 1);
    const crop = { x: mix(from.x, to.x, l), y: mix(from.y, to.y, l), w: mix(from.w, to.w, l), h: mix(from.h, to.h, l) };
    const side = mix(diameter, land.size, l);
    const cx = mix(x, land.x, l);
    const cy = mix(y, land.y, l);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ clipPath: `circle(${mask}px at ${x}px ${y}px)` }}>{children}</AbsoluteFill>
        {rings.length > 0 ? (
          <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {rings}
          </svg>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: cx - side / 2,
            top: cy - side / 2,
            width: side,
            height: side,
            borderRadius: `${50 * (1 - l) ** 1.5}%`,
            overflow: "hidden",
            boxShadow: `0 ${(18 * Math.sin(Math.PI * l)).toFixed(1)}px ${(40 * Math.sin(Math.PI * l)).toFixed(1)}px rgba(21,21,21,${(0.3 * Math.sin(Math.PI * l)).toFixed(3)})`,
          }}
        >
          <ArtImage code={code} width={side} height={side} crop={crop} fast />
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${mask}px at ${x}px ${y}px)` }}>
        {grow > 0 ? children : null}
        <div
          style={{
            position: "absolute",
            left: x - R,
            top: y - R,
            width: diameter,
            height: diameter,
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          <ArtImage code={code} width={diameter} height={diameter} crop={{ x: c.cx - c.r, y: c.cy - c.r, w: 2 * c.r, h: 2 * c.r }} fast />
        </div>
      </AbsoluteFill>
      {rings.length > 0 ? (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {rings}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
}
