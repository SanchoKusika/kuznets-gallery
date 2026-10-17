import { interpolate, useCurrentFrame } from "remotion";
import { ease } from "../theme/easing";

/** Integer counting 0 → `to` over [from, from + duration] (tabular figures are the caller's style). */
export function useCounter(to: number, from: number, duration: number) {
  const frame = useCurrentFrame();
  return Math.round(
    interpolate(frame, [from, from + duration], [0, to], { easing: ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
}
