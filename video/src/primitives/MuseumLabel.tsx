import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { art, cheapest } from "../data/art";
import { copy } from "../data/copy";
import { formatPrice } from "../data/typo";
import { ease, progress } from "../theme/easing";
import { fonts, tabular } from "../theme/fonts";
import { color } from "../theme/tokens";

/**
 * Museum label next to a work (P3): title, code, «холст на подрамнике», cheapest size, «от …» price.
 * Lines appear one by one from `from`, `step` frames apart (brief: ¼ of a sixteenth).
 */
export function MuseumLabel({ code, from, step, x, y, style }: { code: string; from: number; step: number; x: number; y: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const a = art(code);
  const size = cheapest(code);
  const lines: { text: string; css: CSSProperties }[] = [
    { text: a.title, css: { fontFamily: fonts.sans, fontWeight: 500, fontSize: 20, color: color.ink, letterSpacing: "-0.01em" } },
    { text: a.code, css: { ...tabular, fontSize: 16, color: color.ink3, letterSpacing: "0.04em" } },
    { text: copy.promo.canvasOnStretcher, css: { fontFamily: fonts.sans, fontSize: 16, color: color.ink2 } },
    { text: `${size.w}\u00A0×\u00A0${size.h}\u00A0см`, css: { ...tabular, fontSize: 16, color: color.ink2 } },
    { text: `от ${formatPrice(size.price)}`, css: { ...tabular, fontSize: 16, fontWeight: 500, color: color.ink } },
  ];
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {lines.map((l, i) => {
        const p = progress(frame, from + i * step, step * 4, ease.out);
        return (
          <div key={i} style={{ ...l.css, lineHeight: 1.25, opacity: p, translate: `0 ${(1 - p) * 10}px`, whiteSpace: "nowrap" }}>
            {l.text}
          </div>
        );
      })}
    </div>
  );
}
