import { AbsoluteFill, useCurrentFrame } from "remotion";
import { checkCircle, cropMarks, envelope, envelopeSquares, archesSketch } from "../lines/common";
import { INTERIOR, nail, REELS_INTERIORS, wirePath } from "../lines/reels";
import { ArtImage } from "../primitives/ArtImage";
import { LineDrawing, LinePath, MorphLines, pencil } from "../primitives/LinePath";
import { ease, mix, progress } from "../theme/easing";
import { useTiming } from "../theme/timing";
import { color, stroke } from "../theme/tokens";

/** Frames per interior (screen px), same order as REELS_INTERIORS. */
const FRAMES = [
  { w: 620, h: 620 },
  { w: 420, h: 830 },
  { w: 820, h: 482 },
  { w: 620, h: 620 },
];
const NAIL = { x: 540, y: 540 };
const SKETCH = { w: 780, h: 526, cx: 540, cy: 820 };
const ENV = { x: 470, y: 70, w: 300, h: 190 };

const ink = { color: color.ink, width: stroke.reels };

/**
 * Dev sheet for the Reels drawings. Bar 1: everything draws on (the arches over a faded «Три арки»
 * to check the fit). Bars 2–4: nail, wire and frame as in R3, the interiors morphing
 * home → kids → office → cafe → home (1b each, in-out) with the frame resizing.
 */
export const LinesReelsPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, bar } = useTiming();
  const draw = (from: number, dur: number) => pencil(progress(frame, from, dur, ease.out));

  const sketch = archesSketch(SKETCH.w, SKETCH.h);
  const sx = SKETCH.cx - SKETCH.w / 2;
  const sy = SKETCH.cy - SKETCH.h / 2;
  const nailBox = { x: 140 - nail.anchor.x, y: 150 - nail.anchor.y };

  const top = (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={140} cy={150} r={9} fill={color.accent} />
      </svg>
      <LineDrawing art={nail.art} progress={draw(0, b(1))} x={nailBox.x} y={nailBox.y} {...ink} />
      <LineDrawing art={checkCircle(120)} progress={draw(b(0.5), b(1.5))} x={250} y={95} {...ink} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {envelopeSquares(ENV.w, ENV.h).map((q, i) => (
          <rect key={i} x={ENV.x + q.x} y={ENV.y + q.y} width={q.size} height={q.size} fill={color.logoWave} opacity={progress(frame, b(2.5), b(0.5))} />
        ))}
      </svg>
      <LineDrawing art={envelope(ENV.w, ENV.h)} progress={draw(b(1), b(1.5))} x={ENV.x} y={ENV.y} {...ink} />
      <LineDrawing art={checkCircle(56)} progress={draw(b(1), b(1))} x={860} y={130} {...ink} color={color.accent} />
    </>
  );

  // Bar 1: draw-on sheet.
  if (frame < bar(1)) {
    return (
      <AbsoluteFill style={{ backgroundColor: color.paper }}>
        {top}
        <div style={{ position: "absolute", left: sx, top: sy, opacity: 0.4 }}>
          <ArtImage code="KZ-009" width={SKETCH.w} height={SKETCH.h} />
        </div>
        <LineDrawing art={sketch} progress={draw(0, b(2))} x={sx} y={sy} thread={{ from: "left", frameWidth: 1080 }} {...ink} />
        <LineDrawing art={cropMarks(SKETCH.w, SKETCH.h)} progress={draw(b(2), b(0.5))} x={sx} y={sy} {...ink} />
        <LineDrawing art={REELS_INTERIORS[0]} progress={draw(b(0.5), b(1.5))} x={INTERIOR.x} y={INTERIOR.y} thread={{ from: "left", frameWidth: 1080 }} {...ink} />
      </AbsoluteFill>
    );
  }

  // Bars 2–4: morphs at beats 1, 4, 7, 10 of the phase.
  const local = frame - bar(1);
  const starts = [b(1), b(4), b(7), b(10)];
  let k = 0;
  let t = 0;
  starts.forEach((s, i) => {
    if (local >= s) {
      k = i;
      t = progress(local, s, b(1), ease.inOut);
    }
  });
  if (local < starts[0]) {
    k = 0;
    t = 0;
  }
  const n = REELS_INTERIORS.length;
  const from = REELS_INTERIORS[k % n];
  const to = REELS_INTERIORS[(k + 1) % n];
  const fa = FRAMES[k % n];
  const fb = FRAMES[(k + 1) % n];
  const fw = mix(fa.w, fb.w, t);
  const fh = mix(fa.h, fb.h, t);
  const rect = { x: NAIL.x - fw / 2, y: 600, w: fw, h: fh };

  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      {top}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <LinePath d={wirePath(NAIL, rect)} color={color.ink2} width={2} />
        <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill={color.paper3} stroke={color.ink4} strokeWidth={2} />
        <circle cx={NAIL.x} cy={NAIL.y} r={9} fill={color.accent} />
      </svg>
      <LineDrawing art={nail.art} progress={1} x={NAIL.x - nail.anchor.x} y={NAIL.y - nail.anchor.y} {...ink} />
      <MorphLines from={from} to={to} t={t} x={INTERIOR.x} y={INTERIOR.y} {...ink} />
    </AbsoluteFill>
  );
};
