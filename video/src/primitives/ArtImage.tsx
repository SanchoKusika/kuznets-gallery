import type { CSSProperties } from "react";
import { getRemotionEnvironment, Img, staticFile } from "remotion";
import { art as getArt } from "../data/art";
import { ART_SCALE_LIMIT, ART_SCALE_LIMIT_FAST, shadow as shadows } from "../theme/tokens";

/** Region of the source picture, in source pixels. */
export type Crop = { x: number; y: number; w: number; h: number };

type Props = {
  code: string;
  /** Box on screen (before ancestor transforms). */
  width: number;
  height: number;
  /** Source region shown in the box; default — centred cover crop of the whole picture. */
  crop?: Crop;
  /**
   * Product of ancestor scales (camera zoom, scale animations of parents), so the real on-screen
   * scale can be checked against the limit. The component's own `zoom` is counted separately.
   */
  parentScale?: number;
  /** Extra zoom inside the box (Ken Burns / hover approach), ≤ 1.1 and within the limit. */
  zoom?: number;
  /** On screen ≤ 0.3 s: limit 1.25× instead of 1.1× (brief 5.4). */
  fast?: boolean;
  shadow?: boolean;
  /** Dark theme picture filter (P1). */
  filter?: string;
  style?: CSSProperties;
};

const warned = new Set<string>();

/** Scale of the source pixels on screen for this box and crop. */
export function artScale(code: string, width: number, height: number, crop?: Crop) {
  const a = getArt(code);
  const c = crop ?? coverCrop(a.w, a.h, width / height);
  return Math.max(width / c.w, height / c.h);
}

/** Largest centred region of a w×h picture with the given aspect ratio. */
export function coverCrop(w: number, h: number, aspect: number): Crop {
  if (w / h > aspect) {
    const cw = h * aspect;
    return { x: (w - cw) / 2, y: 0, w: cw, h };
  }
  const ch = w / aspect;
  return { x: 0, y: (h - ch) / 2, w, h: ch };
}

/**
 * A picture from public/art (brief 5.4): no rounding, one shadow, never shown larger than 1.1×
 * its natural size (1.25× in fast montages). Over the limit it gets a red outline in Studio and a
 * console warning with its code.
 */
export function ArtImage({ code, width, height, crop, parentScale = 1, zoom = 1, fast, shadow, filter, style }: Props) {
  const a = getArt(code);
  const c = crop ?? coverCrop(a.w, a.h, width / height);
  const k = Math.max(width / c.w, height / c.h);
  const onScreen = k * zoom * parentScale;
  const limit = (fast ? ART_SCALE_LIMIT_FAST : ART_SCALE_LIMIT) + 1e-3;
  const over = onScreen > limit;
  if (over) {
    const key = `${code}@${onScreen.toFixed(3)}`;
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[ArtImage] ${code} «${a.title}» on screen at ${onScreen.toFixed(3)}× > ${limit.toFixed(2)}×`);
    }
  }
  const showOver = over && getRemotionEnvironment().isStudio;
  const s = Math.max(width, height) / 600;
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        boxShadow: shadow ? shadows.float(s) : undefined,
        outline: showOver ? "6px solid #ff0000" : undefined,
        ...style,
      }}
    >
      <Img
        src={staticFile(a.file)}
        style={{
          position: "absolute",
          width: a.w * k,
          height: a.h * k,
          left: -c.x * k - (c.w * k - width) / 2,
          top: -c.y * k - (c.h * k - height) / 2,
          maxWidth: "none",
          filter,
          scale: zoom === 1 ? undefined : String(zoom),
          transformOrigin: `${(c.x + c.w / 2) * k}px ${(c.y + c.h / 2) * k}px`,
        }}
      />
    </div>
  );
}
