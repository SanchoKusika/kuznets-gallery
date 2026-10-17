import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { reels } from "../../data/selection";
import { archesSketch, cropMarks } from "../../lines/common";
import { ArtImage } from "../../primitives/ArtImage";
import { CircleReveal } from "../../primitives/CircleReveal";
import { LineDrawing, pencil } from "../../primitives/LinePath";
import { MaskRise } from "../../primitives/MaskRise";
import { display, label } from "../../theme/fonts";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, REELS_SAFE, stroke, type } from "../../theme/tokens";
import { CUSTOM } from "../layout";

const TITLE_TOP = 300;
const STEPS_TOP = 480;
const SAFE_W = REELS_SAFE.x1 - REELS_SAFE.x0;

/** Box of the sketch / the work (top-left). */
export const customBox = () => ({ x: CUSTOM.cx - CUSTOM.w / 2, y: CUSTOM.cy - CUSTOM.h / 2 });

/** Where the circle opens: the centre of the middle arch's niche, as a share of the box (measured on KZ-009). */
const ARCH_CENTRE = { x: 0.5125, y: 0.27 };

/** The two lines of the title: the question, then the offer. */
const titleLines = () => {
  const s = copy.reels.customTitle;
  const i = s.indexOf("? ");
  return i < 0 ? [s] : [s.slice(0, i + 1), s.slice(i + 2)];
};

/**
 * R6 (bar 7, the break): the title rises, the three arches are sketched by hand at the size of the work, crop marks
 * and the size caption tick in, a circle from the middle arch fills the sketch with the real «Три арки», the steps
 * line lights up word by word. The flat picture is shown until `cut` (R7 replaces it with the 3D canvas there); the
 * texts leave into their masks around the cut.
 */
export function R6Custom({ cut }: { cut: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const box = customBox();
  const code = reels.custom;
  const ink = { color: color.ink, width: stroke.reels };

  // Sketch: +1e…+2b, starting with the thread from the left edge.
  const sketchP = pencil(progress(frame, t.e(1), t.b(1.5), ease.out));
  // Crop marks and caption: +2b, 1e.
  const marksP = pencil(progress(frame, t.b(2), t.e(1), ease.out));
  // Fill: circle from the middle arch, +2.5b, 1b in-out; the lines fade as the picture comes.
  const fillP = progress(frame, t.b(2.5), t.b(1), ease.inOut);
  const cx = box.x + CUSTOM.w * ARCH_CENTRE.x;
  const cy = box.y + CUSTOM.h * ARCH_CENTRE.y;
  const rMax = Math.max(...[box.x, box.x + CUSTOM.w].flatMap((x) => [box.y, box.y + CUSTOM.h].map((y) => Math.hypot(x - cx, y - cy)))) + 2;
  const sketchOpacity = 1 - progress(frame, t.b(2.5) + t.s(1), t.b(1) - t.s(1), ease.out);
  // Marks and caption clear the picture just before the cut, so the canvas starts bare.
  const marksOut = 1 - progress(frame, cut - t.e(1), t.e(1), ease.out);

  const exitTitle = { from: cut - t.s(2), duration: t.e(1), to: "up" as const };
  const exitSteps = { from: cut, duration: t.e(1), to: "up" as const };

  const steps = copy.reels.customSteps;
  const stepsAt = t.b(3);

  return (
    <AbsoluteFill>
      {frame < cut ? (
        <>
          {sketchOpacity > 0 ? (
            <LineDrawing
              art={archesSketch(CUSTOM.w, CUSTOM.h)}
              progress={sketchP}
              x={box.x}
              y={box.y}
              thread={{ from: "left", frameWidth: 1080 }}
              opacity={sketchOpacity}
              {...ink}
            />
          ) : null}
          <CircleReveal x={cx} y={cy} radius={fillP * rMax}>
            <div style={{ position: "absolute", left: box.x, top: box.y }}>
              <ArtImage code={code} width={CUSTOM.w} height={CUSTOM.h} />
            </div>
          </CircleReveal>
          <LineDrawing art={cropMarks(CUSTOM.w, CUSTOM.h)} progress={marksP} x={box.x} y={box.y} opacity={marksOut} {...ink} />
          <div
            style={{
              position: "absolute",
              left: box.x,
              top: box.y + CUSTOM.h + 22,
              width: CUSTOM.w,
              textAlign: "center",
              opacity: marksOut,
            }}
          >
            <MaskRise from={t.b(2)} duration={t.e(1)}>
              <div style={{ ...label(type.reels.label), color: color.ink3 }}>{copy.reels.sketchSize}</div>
            </MaskRise>
          </div>
        </>
      ) : null}

      {/* Title: two lines, a sixteenth apart. */}
      <div style={{ position: "absolute", left: REELS_SAFE.x0, top: TITLE_TOP, width: SAFE_W, textAlign: "center" }}>
        {titleLines().map((line, i) => (
          <MaskRise key={i} from={i * t.s(1)} duration={t.b(1.5)} exit={{ ...exitTitle, from: exitTitle.from + i * t.s(1) / 2 }} style={{ paddingBottom: 6 }}>
            <div style={{ ...display(type.reels.medium, 500, -0.04, 1), color: color.ink }}>{line}</div>
          </MaskRise>
        ))}
      </div>

      {/* Steps: idea → mock-up → print; each word turns accent on its sixteenth. */}
      <div style={{ position: "absolute", left: REELS_SAFE.x0, top: STEPS_TOP, width: SAFE_W, textAlign: "center" }}>
        <MaskRise from={stepsAt} duration={t.e(1)} exit={exitSteps}>
          <div style={{ ...label(type.reels.label), color: color.ink3 }}>
            {steps.map((w, i) => {
              const lit = progress(frame, stepsAt + (i + 1) * t.s(1), Math.max(1, Math.round(t.s(1) / 3)), ease.linear);
              return (
                <span key={w}>
                  {i ? <span style={{ color: color.ink4 }}>{" → "}</span> : null}
                  <span style={{ color: interpolateColors(lit, [0, 1], [color.ink3, color.accent]) }}>{w}</span>
                </span>
              );
            })}
          </div>
        </MaskRise>
      </div>
    </AbsoluteFill>
  );
}
