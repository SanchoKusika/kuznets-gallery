import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BrushStroke, type Pt } from "../../primitives/Brush";
import { MaskRise } from "../../primitives/MaskRise";
import { MorphText } from "../../primitives/MorphText";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { PaintSwap } from "../PaintSwap";
import { heavy, TEXT_X, TEXT_Y } from "../layout";

/** «Три арки» KZ-009 (1080×721) at 0.83×. */
const BOX = { x: 540, y: 1110, w: 900, h: 601 } as const;
const BX = BOX.x - BOX.w / 2;
const BY = BOX.y - BOX.h / 2;
const at = (u: number, v: number): Pt => [BX + u * BOX.w, BY + v * BOX.h];

/** Sketch of the work: the horizon and three pointed arches (where they are on the picture). */
const arch = (cx: number, w: number, top: number, base: number): Pt[] => [
  at(cx - w / 2, base),
  at(cx - w / 2, top + (base - top) * 0.42),
  at(cx - w * 0.3, top + (base - top) * 0.12),
  at(cx, top),
  at(cx + w * 0.3, top + (base - top) * 0.12),
  at(cx + w / 2, top + (base - top) * 0.42),
  at(cx + w / 2, base),
];
const SKETCH: Pt[][] = [
  [at(-0.02, 0.63), at(0.5, 0.62), at(1.02, 0.635)],
  arch(0.2, 0.17, 0.2, 0.63),
  arch(0.5, 0.17, 0.2, 0.63),
  arch(0.8, 0.17, 0.2, 0.63),
];

/**
 * A5 (beats 16–19): «нет нужной?» — a brush sketches the arches, then paint brings the real «Три арки» in over the
 * sketch; the question melts into «нарисуем.» and «за 3–7 дней» rises in accent. Frames relative to A5.
 */
export function A5Custom() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const paintFrom = t.b(1);
  const sketchFade = 1 - progress(frame, paintFrom + t.e(1), t.s(1), ease.linear);
  const exit = { from: t.b(2) + t.e(1) + t.s(1), duration: t.s(1) + 2, easing: ease.menuOut };
  const out = progress(frame, exit.from, exit.duration, ease.in);

  return (
    <AbsoluteFill style={{ translate: `0 ${-out * 60}px`, opacity: 1 - out }}>
      <PaintSwap id="a5" x={BOX.x} y={BOX.y} w={BOX.w} h={BOX.h} items={[{ code: null, at: 0 }, { code: "KZ-009", at: paintFrom }]} duration={t.e(1) + 2} lag={4} paint={bold.yellow} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: sketchFade }}>
        {SKETCH.map((pts, i) => (
          <BrushStroke key={i} points={pts} progress={progress(frame, 2 + i * 5, t.s(1) + 5, ease.out)} width={9} bands={2} rough={0.5} color={bold.ink} seed={`a5-s${i}`} />
        ))}
      </svg>
      {/* Highlight behind «за 3–7 дней». */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <BrushStroke points={[[TEXT_X - 10, TEXT_Y + 248], [TEXT_X + 300, TEXT_Y + 240], [TEXT_X + 590, TEXT_Y + 246]]} progress={progress(frame, t.b(2) + 2, t.s(1) + 3, ease.out)} width={70} color={bold.yellow} seed="a5-hi" rough={0.25} />
      </svg>
      <div style={{ position: "absolute", left: TEXT_X, top: TEXT_Y }}>
        <MaskRise from={0} duration={t.e(1)} style={{ paddingBottom: 6 }}>
          <MorphText texts={["нет нужной?", "нарисуем."]} at={[t.b(1) + t.e(1)]} duration={t.e(1) - 2} style={heavy(150)} blur={40} />
        </MaskRise>
        <MaskRise from={t.b(2)} duration={t.e(1)} style={{ marginTop: 26 }}>
          <div style={heavy(96, bold.accent)}>за 3–7 дней</div>
        </MaskRise>
      </div>
    </AbsoluteFill>
  );
}
