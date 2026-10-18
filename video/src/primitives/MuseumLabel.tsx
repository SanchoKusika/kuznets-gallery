import type { CSSProperties, ReactNode } from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { art, cheapest } from "../data/art";
import { copy } from "../data/copy";
import { formatPrice } from "../data/typo";
import { ease, progress } from "../theme/easing";
import { fonts, tabular } from "../theme/fonts";
import { color } from "../theme/tokens";

/** A row of option chips in a label (like the site's size / frame switch); `active` may be fractional while it changes. */
export type LabelChoice = { line: "size" | "frame"; options: string[]; active: number };

/** Chip geometry, so a scene can aim a cursor at a chip: height, gap, and each chip's width from its text. */
export const LABEL_CHIP = { h: 26, gap: 5, pad: 9, char: 6.9 } as const;
export const chipWidth = (text: string) => Math.round(text.length * LABEL_CHIP.char + 2 * LABEL_CHIP.pad);
/** Centre x of chip i in a row starting at x. */
export const chipCenter = (options: string[], i: number, x = 0) =>
  x + options.slice(0, i).reduce((a, o) => a + chipWidth(o) + LABEL_CHIP.gap, 0) + chipWidth(options[i]) / 2;
/** Line boxes of the label (title 20 px, the rest 16 px, line height 1.25, gap 6): y of each line's top. */
export const LABEL_LINE_TOP = { title: 0, code: 31, frame: 57, size: 83, price: 115 } as const;

function Chips({ choice }: { choice: LabelChoice }) {
  return (
    <div style={{ display: "flex", gap: LABEL_CHIP.gap }}>
      {choice.options.map((o, i) => {
        const on = Math.max(0, 1 - Math.abs(choice.active - i));
        return (
          <div
            key={o}
            style={{
              width: chipWidth(o),
              height: LABEL_CHIP.h,
              borderRadius: 99,
              boxShadow: `inset 0 0 0 1px ${interpolateColors(on, [0, 1], ["rgba(21,21,21,.22)", color.accent])}`,
              background: interpolateColors(on, [0, 1], ["rgba(242,239,233,0)", color.accent]),
              color: interpolateColors(on, [0, 1], [color.ink2, color.onAccent]),
              ...tabular,
              fontSize: 11.5,
              letterSpacing: "0.01em",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            {o}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Museum label next to a work (P3): title, code, «холст на подрамнике», cheapest size, «от …» price.
 * Lines appear one by one from `from`, `step` frames apart (brief: ¼ of a sixteenth). With `choice` the frame or the
 * size line is a row of chips; `price` replaces the «от …» line (the price of the chosen option).
 */
export function MuseumLabel({
  code,
  from,
  step,
  x,
  y,
  choice,
  price,
  style,
}: {
  code: string;
  from: number;
  step: number;
  x: number;
  y: number;
  choice?: LabelChoice;
  price?: string;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const a = art(code);
  const size = cheapest(code);
  const small = (c: CSSProperties = {}): CSSProperties => ({ fontFamily: fonts.sans, fontSize: 16, color: color.ink2, ...c });
  const lines: { node: ReactNode; css: CSSProperties }[] = [
    { node: a.title, css: { fontFamily: fonts.sans, fontWeight: 500, fontSize: 20, color: color.ink, letterSpacing: "-0.01em" } },
    { node: a.code, css: { ...tabular, fontSize: 16, color: color.ink3, letterSpacing: "0.04em" } },
    { node: choice?.line === "frame" ? <Chips choice={choice} /> : copy.promo.canvasOnStretcher, css: small() },
    { node: choice?.line === "size" ? <Chips choice={choice} /> : `${size.w}\u00A0×\u00A0${size.h}\u00A0см`, css: small(tabular) },
    { node: price ?? `от ${formatPrice(size.price)}`, css: small({ ...tabular, fontWeight: 500, color: color.ink }) },
  ];
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {lines.map((l, i) => {
        const p = progress(frame, from + i * step, step * 4, ease.out);
        return (
          // A long title wraps within the column; the short lines never do.
          <div key={i} style={{ ...l.css, lineHeight: 1.25, opacity: p, translate: `0 ${(1 - p) * 10}px`, whiteSpace: i === 0 ? "normal" : "nowrap" }}>
            {l.node}
          </div>
        );
      })}
    </div>
  );
}
