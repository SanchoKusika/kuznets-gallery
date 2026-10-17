import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { review } from "../data/art";
import { typo } from "../data/typo";
import { serif, text } from "../theme/fonts";
import { ease, mix, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";
import { color, type } from "../theme/tokens";
import { MaskRise } from "../primitives/MaskRise";

export type ReviewItem = {
  /** Author as in reviews.json; the text comes from there (the database wins over the brief). */
  name: string;
  /** Frame (relative to the enclosing Sequence) the review starts rising from its mask. */
  at: number;
  /** Quote size, px; default — the format's quote size. */
  size?: number;
  /** Box: left edge, top (while this review is the newest), width. */
  x?: number;
  y?: number;
  width?: number;
  /** How far the earlier reviews move up when this one arrives, px (≈ height of this review + gap). */
  lift?: number;
};

export type ReviewStackProps = {
  items: ReviewItem[];
  align?: "left" | "center" | "right";
  /** Signature (Onest) size, px; default — 26 in Reels, the format's text size in Promo. */
  signatureSize?: number;
  /** Rise from the mask, frames; default 1.5b. */
  rise?: number;
  /** Shift up and fade of the earlier reviews, frames; default 1b. */
  shift?: number;
  /** Opacity the earlier reviews fade to. */
  dim?: number;
  /** All reviews leave up into their masks, the oldest first, `stagger` frames apart. */
  exit?: { from: number; duration?: number; stagger?: number };
  quoteColor?: string;
  signatureColor?: string;
};

/** «Text» with the site's typography; quotes are added unless the text already has them. */
const quoted = (s: string) => typo(s.trim().startsWith("«") ? s.trim() : `«${s.trim()}»`);

/**
 * Reviews (brief 6.3): each new one rises from its mask — the quote (Piazzolla Italic 300, «ёлочки»), then the
 * signature (Onest, ink-3) an eighth later; the earlier ones move up by the new review's `lift` and fade to 35%.
 * Positions are absolute in the frame; the caller lays the items out (they know the copy and the free space).
 */
export function ReviewStack({
  items,
  align = "left",
  signatureSize,
  rise,
  shift,
  dim = 0.35,
  exit,
  quoteColor = color.ink,
  signatureColor = color.ink3,
}: ReviewStackProps) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const { width, height } = useVideoConfig();
  const reels = height > width;
  const fmt = reels ? type.reels : type.promo;
  const riseDur = rise ?? t.b(1.5);
  const shiftDur = shift ?? t.b(1);
  const sigSize = signatureSize ?? (reels ? type.reels.label : fmt.text);
  const exitDur = exit?.duration ?? t.e(1);
  const exitStagger = exit?.stagger ?? t.s(1);

  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        // Later arrivals push this one up and dim it.
        const later = items.slice(i + 1).map((n) => ({ lift: n.lift ?? 0, p: progress(frame, n.at, shiftDur, ease.inOut) }));
        const dy = later.reduce((s, n) => s + n.lift * n.p, 0);
        const fade = later.reduce((m, n) => Math.max(m, n.p), 0);
        const size = it.size ?? fmt.quote;
        const boxW = it.width ?? width - 2 * (reels ? 90 : 96);
        const left = it.x ?? (width - boxW) / 2;
        const exitAt = exit ? { from: exit.from + i * exitStagger, duration: exitDur, to: "up" as const } : undefined;
        if (frame < it.at) return null;
        return (
          <div
            key={it.name}
            style={{
              position: "absolute",
              left,
              top: (it.y ?? 0) - dy,
              width: boxW,
              textAlign: align,
              opacity: mix(1, dim, fade),
            }}
          >
            <MaskRise from={it.at} duration={riseDur} exit={exitAt}>
              <div style={{ ...serif(size, 1.15), color: quoteColor, textWrap: "balance" }}>{quoted(review(it.name).text)}</div>
            </MaskRise>
            <MaskRise
              from={it.at + t.e(1)}
              duration={riseDur}
              exit={exitAt}
              style={{ marginTop: Math.round(size * 0.36) }}
            >
              <div style={{ ...text(sigSize, 400), color: signatureColor }}>{it.name}</div>
            </MaskRise>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
