import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ease, progress } from "../theme/easing";
import { color } from "../theme/tokens";
import { useTiming } from "../theme/timing";

/**
 * Curtains like the site's mobile menu (transition 3): ink → accent → paper panels slide in from the
 * right, `translateX(100%) → 0`, ≈ 4 frames apart, menu-in. The paper panel stays: a clean sheet.
 * `duration` is the whole transition (default 1 beat).
 */
export function Curtains({ from = 0, duration }: { from?: number; duration?: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const total = duration ?? t.b(1);
  const gap = Math.round((4 * t.fps) / 60);
  const each = total - 2 * gap;
  const panels = [color.ink, color.accent, color.paper];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {panels.map((bg, i) => (
        <AbsoluteFill key={bg} style={{ background: bg, translate: `${(1 - progress(frame, from + i * gap, each, ease.menuIn)) * 100}% 0` }} />
      ))}
    </AbsoluteFill>
  );
}
