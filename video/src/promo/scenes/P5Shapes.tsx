import { Sequence, useCurrentFrame } from "remotion";
import { promo } from "../../data/selection";
import { ArchWindow } from "../../effects/ArchWindow";
import { CircleMontage } from "../../effects/CircleMontage";
import { ARCH } from "../../lines/promo";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, stroke } from "../../theme/tokens";

/**
 * P5 (bars 10–11): the circle montage of R4 at ⌀ 480 (a work per eighth, accent rings), then on +4b the circle
 * morphs into the arch and the arch works rise in it every ¾b; at +7.25b the outline flies past the camera.
 * Frames relative to P5.
 */
export function P5Shapes() {
  const frame = useCurrentFrame();
  const t = useTiming();
  // The ring P4's ribbon wound into: it holds while the circle opens inside it, then fades.
  const ring = 1 - progress(frame, t.e(1), t.e(1), ease.out);
  const arch = promo.arch.map((code, i) => ({ code, at: i === 0 ? t.b(4) : t.b(4.5 + 0.75 * i) }));
  return (
    <>
      <Sequence name="P5 круги" durationInFrames={t.b(4)}>
        <CircleMontage codes={promo.circles} diameter={2 * ARCH.circleR} x={ARCH.cx} y={ARCH.cy} strokeWidth={stroke.promo} />
      </Sequence>
      {ring > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <circle cx={ARCH.cx} cy={ARCH.cy} r={ARCH.circleR} fill="none" stroke={color.accent} strokeWidth={4} opacity={ring} />
        </svg>
      ) : null}
      <Sequence name="P5 арка" from={t.b(4)} durationInFrames={t.b(4)}>
        <ArchWindow
          works={arch.map((w) => ({ ...w, at: w.at - t.b(4) }))}
          morph={{ from: 0, duration: t.e(1) }}
          rise={t.e(1)}
          fly={{ from: t.b(3.25), duration: t.b(0.75) }}
        />
      </Sequence>
    </>
  );
}
