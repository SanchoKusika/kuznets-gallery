import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { ease, progress, type EaseFn } from "../theme/easing";

// Liquid text morph: the outgoing and the incoming words cross-fade through a growing blur, and an alpha threshold
// (SVG filter) turns the blurred mix back into crisp, solid glyphs — the letters melt into each other. Outside a
// morph the text is drawn plainly, so every hold is pixel-sharp.

const FILTER_ID = "kz-morph-threshold";

/** The threshold filter; mount once per composition (it is referenced by id). */
export function MorphFilter() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id={FILTER_ID} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
        </filter>
      </defs>
    </svg>
  );
}

type Props = {
  /** The words in order. */
  texts: readonly string[];
  /** Frames (relative to the Sequence) at which text k → k + 1 starts morphing; length = texts.length − 1. */
  at: readonly number[];
  duration: number;
  easing?: EaseFn;
  /** Peak blur, px (scales with the type size). */
  blur?: number;
  style?: CSSProperties;
  /** How the words line up when their widths differ. */
  align?: "start" | "center" | "end";
};

// Mid-morph both words must be well blurred, or the threshold shows two sets of letters on top of each other.
const blurOf = (t: number, peak: number) => (t <= 0 ? peak : Math.min(peak, peak * 0.3 * (1 / t - 1)));

export function MorphText({ texts, at, duration, easing = ease.inOut, blur = 40, style, align = "start" }: Props) {
  const frame = useCurrentFrame();
  // The morph in progress (or the last finished one).
  let k = 0;
  while (k < at.length && frame >= at[k] + duration) k++;
  const morphing = k < at.length && frame >= at[k];
  const t = morphing ? progress(frame, at[k], duration, easing) : 0;
  const cell: CSSProperties = { gridArea: "1 / 1", whiteSpace: "pre", justifySelf: align };
  if (!morphing) {
    return (
      <div style={{ display: "grid", ...style }}>
        <span style={cell}>{texts[k]}</span>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", filter: `url(#${FILTER_ID})`, ...style }}>
      <span style={{ ...cell, filter: `blur(${blurOf(1 - t, blur)}px)`, opacity: (1 - t) ** 0.4 }}>{texts[k]}</span>
      <span style={{ ...cell, filter: `blur(${blurOf(t, blur)}px)`, opacity: t ** 0.4 }}>{texts[k + 1]}</span>
    </div>
  );
}
