import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrushStroke, Splat } from "../../primitives/Brush";
import { ArtImage } from "../../primitives/ArtImage";
import { MaskRise } from "../../primitives/MaskRise";
import { MorphText } from "../../primitives/MorphText";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { heavy, HERO, SMALLS, TEXT_X, TEXT_Y } from "../layout";

const SIZE = 190;
const LINE = SIZE * 0.9;

/**
 * A1 (beats 0–4): «пустая стена?» rises; the accent dot drops, lands and opens into the hero picture; a brush
 * strikes out «пустая», which melts into «яркая» over a yellow highlight; three small pictures pop round the hero
 * and paint lands on it. Frames relative to A1.
 */
export function A1Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTiming();

  // Dot: falls (ease-in) onto the hero's centre on beat 1, squashes, then opens into the picture.
  const fallFrom = t.e(1);
  const land = t.b(1);
  const fallP = progress(frame, fallFrom, land - fallFrom, ease.in);
  const dotY = mix(-80, HERO.y, fallP);
  const squash = frame >= land ? Math.sin(Math.PI * Math.min(1, (frame - land) / t.s(1))) : 0;
  const openFrom = land + t.s(1);
  const openP = progress(frame, openFrom, t.e(1) + t.s(1), ease.inOut);
  const cover = (HERO.size / 2) * Math.SQRT2 + 2;
  const discR = mix(22, cover + 24, openP);
  const imgR = Math.max(0, discR - 24);

  // Strike-out, then the morph and the highlight.
  const strikeFrom = t.b(2);
  const strikeP = progress(frame, strikeFrom, t.s(1) + 2, ease.out);
  const morphAt = t.b(2) + t.e(1) - 2;
  const morphDur = t.e(1);
  const strikeFade = 1 - progress(frame, morphAt, morphDur * 0.8, ease.linear);
  const hiP = progress(frame, morphAt + 2, t.e(1), ease.out);

  // Smalls pop on 16ths from beat 3; paint on the hero after them.
  const pops = SMALLS.map((_, i) => spring({ frame: frame - (t.b(3) + i * t.s(1)), fps, config: { damping: 11, stiffness: 190, mass: 0.7 } }));
  const splatP = progress(frame, t.b(3) + t.s(1), t.s(1), ease.out);
  const swooshP = progress(frame, t.b(3) + t.e(1), t.s(1) + 3, ease.out);

  const textExit = { from: t.b(3) + t.e(1) + t.s(1), duration: t.e(1), easing: ease.menuOut };
  const h0 = HERO.size / 2;

  return (
    <AbsoluteFill>
      {/* Hero: accent disc leads, the picture follows inside it; both clipped to the square. */}
      {frame >= openFrom ? (
        <div style={{ position: "absolute", left: HERO.x - h0, top: HERO.y - h0, width: HERO.size, height: HERO.size, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: h0 - discR, top: h0 - discR, width: discR * 2, height: discR * 2, borderRadius: "50%", background: bold.accent }} />
          <div style={{ position: "absolute", inset: 0, clipPath: `circle(${imgR}px at 50% 50%)` }}>
            <ArtImage code={HERO.code} width={HERO.size} height={HERO.size} />
          </div>
        </div>
      ) : frame >= fallFrom ? (
        <div
          style={{
            position: "absolute",
            left: HERO.x - 22,
            top: dotY - 22,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: bold.accent,
            scale: `${1 + 0.35 * squash} ${1 - 0.3 * squash}`,
            transformOrigin: "50% 100%",
          }}
        />
      ) : null}

      {/* Paint on the hero. */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Splat x={HERO.x + h0 - 30} y={HERO.y - h0 + 40} r={46} p={splatP} color={bold.accent} seed="a1-splat" angle={-0.9} />
        <BrushStroke
          points={[[HERO.x - h0 - 30, HERO.y + h0 - 150], [HERO.x - 120, HERO.y + h0 - 40], [HERO.x + 60, HERO.y + h0 - 20], [HERO.x + 200, HERO.y + h0 + 20]]}
          progress={swooshP}
          width={40}
          color={bold.bg}
          seed="a1-swoosh"
        />
      </svg>

      {/* Small pictures: pop from 0 with an overshoot, slightly turned. */}
      {SMALLS.map((s, i) =>
        pops[i] > 0.001 ? (
          <div key={s.code} style={{ position: "absolute", left: s.x - s.size / 2, top: s.y - s.size / 2, scale: String(pops[i]), rotate: `${s.rot}deg` }}>
            <ArtImage code={s.code} width={s.size} height={s.size} parentScale={Math.max(1, pops[i])} />
          </div>
        ) : null,
      )}

      {/* Yellow highlight under the first line (behind the type). */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <BrushStroke points={[[TEXT_X - 14, TEXT_Y + LINE * 0.62], [TEXT_X + 260, TEXT_Y + LINE * 0.58], [TEXT_X + 560, TEXT_Y + LINE * 0.6]]} progress={hiP} width={96} color={bold.yellow} seed="a1-hi" rough={0.25} />
      </svg>

      <div style={{ position: "absolute", left: TEXT_X, top: TEXT_Y }}>
        <MaskRise from={0} duration={t.e(1)} exit={textExit} style={{ paddingBottom: 6 }}>
          <MorphText texts={["пустая", "яркая"]} at={[morphAt]} duration={morphDur} style={heavy(SIZE)} blur={46} />
        </MaskRise>
        <MaskRise from={3} duration={t.e(1)} exit={{ ...textExit, from: textExit.from + 2 }} style={{ paddingBottom: 6 }}>
          <MorphText texts={["стена?", "стена."]} at={[morphAt + 2]} duration={morphDur} style={heavy(SIZE)} blur={46} />
        </MaskRise>
      </div>

      {/* The strike-out over «пустая». */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: strikeFade }}>
        <BrushStroke
          points={[[TEXT_X - 24, TEXT_Y + LINE * 0.6], [TEXT_X + 300, TEXT_Y + LINE * 0.5], [TEXT_X + 640, TEXT_Y + LINE * 0.44]]}
          progress={strikeP}
          width={34}
          color={bold.accent}
          seed="a1-strike"
        />
      </svg>
    </AbsoluteFill>
  );
}
