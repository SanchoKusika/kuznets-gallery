import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Canvas3D } from "../../effects/Canvas3D";
import { BagetFrame, GlassFrame } from "../../effects/Framing";
import { ArtImage } from "../../primitives/ArtImage";
import { BrushStroke } from "../../primitives/Brush";
import { MaskRise } from "../../primitives/MaskRise";
import { MorphText } from "../../primitives/MorphText";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { PaintSwap } from "../PaintSwap";
import { heavy, STAGE, TEXT_X, TEXT_Y } from "../layout";

const CODE = "KZ-024";
const S = STAGE.size;
const BAR = 30;
const GLASS = S + 40;

/**
 * A4 (beats 12–16): «холст. → багет. → стекло.» KZ-024 is painted over the cafe picture, turns in 3D to show the
 * canvas on its stretcher, comes back flat and a baguette snaps round it; then the framed piece flips over and lands
 * as a print under glass with a glint. Frames relative to A4.
 */
export function A4Formats() {
  const frame = useCurrentFrame();
  const t = useTiming();

  // The paint-in ends at ½ beat; then the canvas turns out to −30° and is back flat by beat 13.
  const paintEnd = t.e(1) + 1;
  const turnOut = progress(frame, paintEnd, t.b(1) - paintEnd, ease.out);
  const turnBack = progress(frame, t.b(1), t.s(1) + 2, ease.inOut);
  const rotY = -30 * turnOut * (1 - turnBack);
  const rotX = 7 * turnOut * (1 - turnBack);
  const is3D = frame >= paintEnd && turnBack < 1;

  // Baguette bars, one per 1/16 from just after beat 13.
  const barFrom = t.b(1) + t.s(1) + 3;
  const bars = [0, 1, 2, 3].map((i) => progress(frame, barFrom + i * 3, t.s(1), ease.menuIn));
  const framed = frame >= barFrom;

  // Flip to glass on beat 14: out to 90° (ease-in), swap, back from −90°.
  const flipFrom = t.b(2) - t.s(1);
  const half = t.s(1) + 1;
  const flipOut = progress(frame, flipFrom, half, ease.in);
  const flipIn = progress(frame, flipFrom + half, half + 2, ease.out);
  const glass = frame >= flipFrom + half;
  const flipDeg = glass ? -90 * (1 - flipIn) : 90 * flipOut;
  const glint = progress(frame, t.b(2) + t.e(1), t.b(1), ease.inOut);

  // Exit: up and away on the last eighth.
  const exitP = progress(frame, t.b(3) + t.e(1), t.e(1), ease.in);
  const push = mix(1, 1.04, progress(frame, t.b(2) + t.e(1), t.b(1), ease.out));
  const exitY = -exitP * 1400;

  const morphs = [t.b(1) - 3, t.b(2) - 3];
  const word = frame < morphs[0] ? 0 : frame < morphs[1] ? 1 : 2;
  const wordFrom = [t.s(1), morphs[0] + 4, morphs[1] + 4][word];
  const exit = { from: t.b(3) + t.e(1), duration: t.e(1), easing: ease.menuOut };

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, translate: `0 ${exitY}px` }}>
        {frame < paintEnd ? (
          <PaintSwap id="a4" x={STAGE.x} y={STAGE.y} w={S} h={S} items={[{ code: "KZ-126", at: 0 }, { code: CODE, at: 0 }]} duration={t.s(1) + 4} />
        ) : is3D ? (
          <Canvas3D code={CODE} faceWidth={S} faceHeight={S} x={STAGE.x} y={STAGE.y} rotY={rotY} rotX={rotX} perspective={2600} depth={0.05} shadow={0.8} />
        ) : (
          <div
            style={{
              position: "absolute",
              left: STAGE.x - S / 2 - (glass ? (GLASS - S) / 2 : BAR),
              top: STAGE.y - S / 2 - (glass ? (GLASS - S) / 2 : BAR),
              transform: `perspective(2400px) rotateY(${flipDeg}deg) scale(${push})`,
            }}
          >
            {glass ? (
              <GlassFrame code={CODE} w={GLASS} h={GLASS} glint={glint} tone={{ frame: "#F4F4F4", mat: bold.bg }} />
            ) : framed ? (
              <BagetFrame code={CODE} w={S} h={S} bar={BAR} bars={bars} />
            ) : (
              <div style={{ margin: BAR }}>
                <ArtImage code={CODE} width={S} height={S} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* The word and its underline, repainted for every word. */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - progress(frame, exit.from, exit.duration, ease.linear) }}>
        <BrushStroke
          key={word}
          points={[[TEXT_X - 6, TEXT_Y + 196], [TEXT_X + 300, TEXT_Y + 186], [TEXT_X + 600, TEXT_Y + 192]]}
          progress={progress(frame, wordFrom, t.s(1) + 3, ease.out)}
          width={24}
          bands={4}
          color={bold.accent}
          seed={`a4-u${word}`}
        />
      </svg>
      <div style={{ position: "absolute", left: TEXT_X, top: TEXT_Y }}>
        <MaskRise from={0} duration={t.e(1)} exit={exit} style={{ paddingBottom: 6 }}>
          <MorphText texts={["холст.", "багет.", "стекло."]} at={morphs} duration={t.e(1) - 2} style={heavy(190)} blur={46} />
        </MaskRise>
      </div>
    </AbsoluteFill>
  );
}
