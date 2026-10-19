import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CONTACTS } from "../../data/site";
import { LogoBuild, logoGeometry, type LogoSchedule } from "../../effects/LogoBuild";
import { ArtImage } from "../../primitives/ArtImage";
import { BrushStroke } from "../../primitives/Brush";
import { MaskRise } from "../../primitives/MaskRise";
import { ease, mix, progress } from "../../theme/easing";
import { fonts } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { bold, color } from "../../theme/tokens";
import { SHOTS } from "./A6Montage";

const LOGO = { width: 900, x: 540, y: 830 } as const;
const G = logoGeometry(LOGO.width, LOGO.x, LOGO.y);
const LAST = SHOTS[SHOTS.length - 1][0];

/**
 * A7 (beats 24–30): the last picture folds into a dot that flies into the «O» and becomes the logo's own dot; the
 * logo builds round it (wave painted in, beads, letters, GALLERY), then the site in an accent pill over a yellow
 * swash and both phones. Holds to the end. Frames relative to A7.
 */
export function A7Logo() {
  const frame = useCurrentFrame();
  const t = useTiming();
  // Fold: a circular crop shrinks from covering the picture to the dot and travels into the «O».
  const foldDur = t.e(1) - 3;
  const fold = progress(frame, 0, foldDur, ease.inOut);
  const cover = Math.hypot(LAST.w, LAST.h) / 2;
  const r = mix(cover, G.dot.r, fold);
  const cx = mix(LAST.x, G.dot.cx, fold);
  const cy = mix(LAST.y, G.dot.cy, fold);
  const tint = progress(fold, 0.55, 0.45, ease.linear);
  const landed = frame >= foldDur;

  const schedule: LogoSchedule = {
    wave: { from: t.s(1), duration: t.e(1) },
    beads: [t.e(1), t.e(1) + t.s(1), t.b(1)],
    letters: t.e(1) + t.s(1),
    gallery: t.b(1) + t.e(1),
    breath: t.b(2) + t.e(1),
  };

  return (
    <AbsoluteFill>
      {!landed ? (
        <>
          <div style={{ position: "absolute", left: LAST.x - LAST.w / 2, top: LAST.y - LAST.h / 2, width: LAST.w, height: LAST.h, clipPath: `circle(${r}px at ${cx - (LAST.x - LAST.w / 2)}px ${cy - (LAST.y - LAST.h / 2)}px)` }}>
            <ArtImage code={LAST.code} width={LAST.w} height={LAST.h} />
          </div>
          <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: color.logoDot, opacity: tint }} />
        </>
      ) : null}
      <LogoBuild width={LOGO.width} x={LOGO.x} y={LOGO.y} schedule={schedule} dotScale={landed ? 1 : 0} />

      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <BrushStroke points={[[300, 1106], [540, 1096], [790, 1104]]} progress={progress(frame, t.b(2), t.s(1) + 4, ease.out)} width={110} color={bold.yellow} seed="a7-swash" rough={0.3} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center" }}>
        <MaskRise from={t.b(2) + 4} duration={t.e(1)}>
          <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 58, letterSpacing: "-0.02em", color: bold.bg, background: bold.accent, borderRadius: 999, padding: "10px 40px 14px" }}>
            kuznets.uz
          </div>
        </MaskRise>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1190, display: "flex", justifyContent: "center" }}>
        <MaskRise from={t.b(2) + t.e(1) + 2} duration={t.e(1)}>
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 40, letterSpacing: "-0.01em", color: bold.ink, fontVariantNumeric: "tabular-nums" }}>
            {CONTACTS.phones.map((p) => p.label).join("   ·   ")}
          </div>
        </MaskRise>
      </div>
    </AbsoluteFill>
  );
}
