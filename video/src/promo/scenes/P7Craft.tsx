import { AbsoluteFill, useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { FRAMES } from "../../data/site";
import { promo } from "../../data/selection";
import { Canvas3D } from "../../effects/Canvas3D";
import { BagetFrame, GlassFrame } from "../../effects/Framing";
import { WeaveTexture } from "../../effects/WeaveTexture";
import { ArtImage } from "../../primitives/ArtImage";
import { FadeRise, MaskRise } from "../../primitives/MaskRise";
import { display, label, text } from "../../theme/fonts";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, type } from "../../theme/tokens";

/** The print on the cloth (KZ-022), centred. */
const PRINT = { size: 600, x: 960, y: 540 };
/** Three columns (the approved styleframe): 420² each, 80 apart, from y 300. */
const COLS = { size: 420, gap: 80, top: 300 };
const colX = (i: number) => (1920 - (3 * COLS.size + 2 * COLS.gap)) / 2 + i * (COLS.size + COLS.gap);

/**
 * P7 (bars 13–15, the break): the canvas cloth fills the frame and pulls back (2 → 1, 1.5b); a print head passes top
 * to bottom and the work appears behind it on the cloth; the cloth around clears to the wall; the canvas turns to its
 * back (the stretcher), three staples, back to the face; it shrinks into the first of three columns — on a stretcher,
 * in a baguette (four bars snap in), on paper under glass (a glint). Frames relative to P7.
 */
export function P7Craft() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const code = promo.craft;

  const pullback = mix(2, 1, progress(frame, 0, t.b(1.5), ease.out));
  const head = progress(frame, t.b(1), t.b(1.5), ease.inOut);
  const headY = mix(PRINT.y - PRINT.size / 2 - 40, PRINT.y + PRINT.size / 2 + 40, head);
  const printed = Math.max(0, Math.min(PRINT.size, headY - (PRINT.y - PRINT.size / 2)));
  const clothOut = progress(frame, t.b(2.5), t.e(1), ease.inOut);
  const solid = frame >= t.b(3);

  // The canvas in 3D from +3b: to the back and round again, then into column 1 at its styleframe angle.
  const back = progress(frame, t.b(3), t.b(1), ease.inOut);
  const front = progress(frame, t.b(5.5), t.b(1), ease.inOut);
  const toCol = progress(frame, t.b(6.5), t.b(1), ease.inOut);
  const staples = [4, 4.5, 5].reduce((n, b) => n + progress(frame, t.b(b), t.s(1), ease.linear), 0);
  // A small lift while turning keeps the near edge within 1.1× of the source.
  const lift = 1 - 0.06 * Math.sin(Math.PI * back) - 0.06 * Math.sin(Math.PI * front);

  const bars = [0, 1, 2, 3].map((i) => progress(frame, t.b(7.5) + i * t.s(1), t.s(1), ease.menuIn));
  const glint = progress(frame, t.b(9), t.b(1), ease.inOut);

  // The three columns hold for a bar and a half: the camera drifts in a little meanwhile.
  const drift = 1 + 0.03 * progress(frame, t.b(8), t.b(4), ease.inOut);

  return (
    <AbsoluteFill style={{ scale: String(drift), transformOrigin: "960px 560px" }}>
      {!solid ? (
        <>
          <AbsoluteFill style={{ opacity: 1 - clothOut }}>
            <WeaveTexture width={1920} height={1080} scale={pullback} pitch={5} />
          </AbsoluteFill>
          {/* The print lands in the weave (multiply), then stands on the wall with its shadow as the cloth clears. */}
          <div
            style={{
              position: "absolute",
              left: PRINT.x - PRINT.size / 2,
              top: PRINT.y - PRINT.size / 2,
              width: PRINT.size,
              height: printed,
              overflow: "hidden",
              mixBlendMode: clothOut > 0 ? undefined : "multiply",
              boxShadow: clothOut > 0 ? `0 ${30 * clothOut}px ${60 * clothOut}px -24px rgba(21,21,21,${0.45 * clothOut})` : undefined,
            }}
          >
            <ArtImage code={code} width={PRINT.size} height={PRINT.size} />
          </div>
          {head > 0 && head < 1 ? (
            <div style={{ position: "absolute", left: PRINT.x - 400, top: headY - 9, width: 800, height: 18, background: color.ink, borderRadius: 4 }}>
              <div style={{ position: "absolute", left: 12, right: 12, top: 5, height: 2, background: color.paperRaised, opacity: 0.6 }} />
            </div>
          ) : null}
        </>
      ) : (
        <Canvas3D
          code={code}
          faceWidth={PRINT.size}
          faceHeight={PRINT.size}
          x={mix(PRINT.x, colX(0) + COLS.size / 2, toCol)}
          y={mix(PRINT.y, COLS.top + COLS.size / 2, toCol)}
          rotY={180 * back - 180 * front - 16 * toCol}
          rotX={3 * toCol}
          scale={lift * mix(1, COLS.size / PRINT.size, toCol)}
          staples={staples}
        />
      )}

      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center" }}>
        <MaskRise from={t.b(6.5)} duration={t.b(1.5)} innerStyle={{ paddingBottom: 10 }}>
          <div style={{ ...display(type.promo.medium, 500, -0.04, 1), color: color.ink }}>{copy.promo.framingTitle}</div>
        </MaskRise>
      </div>

      <FadeRise from={t.b(7)} duration={t.b(1)} style={{ position: "absolute", left: colX(1) - 28, top: COLS.top - 28 }}>
        <BagetFrame code={code} w={COLS.size} h={COLS.size} bars={bars} />
      </FadeRise>
      <FadeRise from={t.b(7.25)} duration={t.b(1)} style={{ position: "absolute", left: colX(2), top: COLS.top }}>
        <GlassFrame code={code} w={COLS.size} h={COLS.size} glint={glint} />
      </FadeRise>

      {FRAMES.map((f, i) => (
        <FadeRise key={f.n} from={t.b(7.5) + i * t.b(0.25)} duration={t.b(1)} style={{ position: "absolute", left: colX(i), top: COLS.top + COLS.size + 64, width: COLS.size }}>
          <div style={{ ...text(type.promo.text, 500), color: color.ink }}>{f.n}</div>
          <div style={{ ...label(16), color: i === 0 ? color.accent : color.ink3, marginTop: 8 }}>{f.note}</div>
        </FadeRise>
      ))}
    </AbsoluteFill>
  );
}
