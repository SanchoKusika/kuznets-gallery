import { useCurrentFrame } from "remotion";
import { ArtImage } from "../primitives/ArtImage";
import { brushPaths, smoothLine, type Pt } from "../primitives/Brush";
import { ease, progress } from "../theme/easing";
import { bold } from "../theme/tokens";

// Picture change by paint: a wide brush zigzags over the box in the accent colour and the next picture follows a few
// frames behind inside the same stroke (an SVG clip), so the new work is literally painted in. When the stroke
// is done the clip is dropped — the picture is whole, with no gaps the zigzag might leave.

/** Zigzag centre line over a w×h box (box coordinates). */
export const zigzag = (w: number, h: number): Pt[] => [
  [-0.2 * w, 0.06 * h],
  [1.2 * w, 0.16 * h],
  [-0.2 * w, 0.42 * h],
  [1.2 * w, 0.56 * h],
  [-0.2 * w, 0.8 * h],
  [1.2 * w, 0.94 * h],
];

/** `code: null` — nothing there yet (the first picture is painted onto the white). */
type Item = { code: string | null; at: number };

type Props = {
  id: string;
  /** Box centre and size on screen. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pictures in order; the first is shown from the start, each next one is painted in from its `at`. */
  items: readonly Item[];
  /** Length of one stroke, frames. */
  duration: number;
  /** The picture trails the paint by this many frames. */
  lag?: number;
  paint?: string;
  /** Scale of the whole box (punches), counted into the picture-size check. */
  scale?: number;
};

export function PaintSwap({ id, x, y, w, h, items, duration, lag = 3, paint = bold.accent, scale = 1 }: Props) {
  const frame = useCurrentFrame();
  const line = smoothLine(zigzag(w, h), 180);
  const width = h * 0.36;
  // The last picture already fully painted in; everything under it is gone.
  let base = 0;
  items.forEach((it, i) => {
    if (i > 0 && frame >= it.at + lag + duration) base = i;
  });
  const baseCode = items[base].code;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, scale: String(scale) }}>
      {baseCode ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <ArtImage code={baseCode} width={w} height={h} parentScale={scale} />
        </div>
      ) : null}
      {items.map((it, i) => {
        if (i <= base || frame < it.at) return null;
        const pp = progress(frame, it.at, duration, ease.inOut);
        const ip = progress(frame, it.at + lag, duration, ease.inOut);
        const clipId = `${id}-clip-${i}`;
        return (
          <div key={i} style={{ position: "absolute", inset: 0 }}>
            <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <defs>
                <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                  {brushPaths(line, ip, { width, seed: `${clipId}-img`, rough: 0.3 }).map((d, k) => (
                    <path key={k} d={d} />
                  ))}
                </clipPath>
              </defs>
              <g fill={paint}>
                {brushPaths(line, pp, { width: width * 1.04, seed: `${clipId}-paint`, rough: 0.35 }).map((d, k) => (
                  <path key={k} d={d} />
                ))}
              </g>
            </svg>
            {ip > 0 && it.code ? (
              <div style={{ position: "absolute", inset: 0, clipPath: `url(#${clipId})` }}>
                <ArtImage code={it.code} width={w} height={h} parentScale={scale} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
