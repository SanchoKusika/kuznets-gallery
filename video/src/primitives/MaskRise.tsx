import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { ease, progress, type EaseFn } from "../theme/easing";

type Props = {
  /** Frame (relative to the enclosing Sequence) the rise starts. */
  from: number;
  duration: number;
  easing?: EaseFn;
  /** Leaves upwards into the same mask. */
  exit?: { from: number; duration: number; easing?: EaseFn; to?: "up" | "down" };
  /** Starting offset, % of own height (105 by default, brief 5.6). */
  offset?: number;
  /**
   * How far the exit travels, % of own height. Further than the entry: glyphs overflow the line box (descenders of
   * «д», «у», «р»), and at 105% their tails would stay in the mask.
   */
  exitOffset?: number;
  children: ReactNode;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
};

/** Rise from a mask: `translateY(105%) → 0` inside `overflow: hidden` (transition 1 of the vocabulary). */
export function MaskRise({ from, duration, easing = ease.rise, exit, offset = 105, exitOffset = 160, children, style, innerStyle }: Props) {
  const frame = useCurrentFrame();
  const inP = progress(frame, from, duration, easing);
  const outP = exit ? progress(frame, exit.from, exit.duration, exit.easing ?? ease.menuIn) : 0;
  const y = (1 - inP) * offset - outP * exitOffset * (exit?.to === "down" ? -1 : 1);
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div style={{ translate: `0 ${y}%`, ...innerStyle }}>{children}</div>
    </div>
  );
}

/** Appear with a short rise: opacity 0 → 1 and 24 px up (texts, captions). */
export function FadeRise({
  from,
  duration,
  easing = ease.out,
  distance = 24,
  exit,
  children,
  style,
}: {
  from: number;
  duration: number;
  easing?: EaseFn;
  distance?: number;
  exit?: { from: number; duration: number; to?: number };
  children: ReactNode;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const p = progress(frame, from, duration, easing);
  const out = exit ? progress(frame, exit.from, exit.duration, ease.out) : 0;
  return (
    <div style={{ opacity: p * (1 - out * (1 - (exit?.to ?? 0))), translate: `0 ${(1 - p) * distance}px`, ...style }}>{children}</div>
  );
}
