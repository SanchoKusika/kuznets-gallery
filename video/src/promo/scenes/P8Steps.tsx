import { evolvePath } from "@remotion/paths";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { STEPS } from "../../data/site";
import { promo } from "../../data/selection";
import { archesSketch, cropMarks, envelope, envelopeSquares } from "../../lines/common";
import { PROMO_ROOM, PROMO_ROOMS } from "../../lines/promoRooms";
import { ArtImage } from "../../primitives/ArtImage";
import { LineDrawing, pencil } from "../../primitives/LinePath";
import { prepareRoom, RoomStrokes } from "../../primitives/LineRoom";
import { FadeRise, MaskRise } from "../../primitives/MaskRise";
import { display, label, tabular } from "../../theme/fonts";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, stroke, type } from "../../theme/tokens";

/** The steps line and its beads (brief P8). */
const LINE_Y = 760;
const BEADS = [360, 660, 960, 1260, 1560];
/** The story box over the line: «Три арки» at 600 wide (its own proportions). */
const BOX = { w: 600, h: 385, x: 660, y: 290 };
/** The home of the end: the hall room standing on the steps line, the sofa centred. */
const ROOM_X = -70;

const LINE = { color: color.ink, width: stroke.promo };
const FINE = { color: color.ink3, width: stroke.promo * 0.7 };

/** The thread entering from the left as a wave and straightening (flat 0 → 1) into the steps line. */
function threadLine(flat: number) {
  let d = "";
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const x = -20 + 1960 * u;
    const env = (1 - flat) * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u) ** 1.1;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${(LINE_Y + 70 * env * Math.sin(2 * Math.PI * 2.4 * u)).toFixed(1)}`;
  }
  return d;
}

/**
 * P8 (bars 16–17): the thread comes in from the left and straightens into a line with five beads; the title; on every
 * beat a bead lights up (accent, 1.4×) with its step under it, and the story over the line follows: the sketch of the
 * three arches, crop marks and the size, the approval tick, a print pass bringing the work, the kraft envelope taking
 * it away. Then the beads step back and the line is the floor of a room: «Три арки» hangs over the sofa. Frames
 * relative to P8.
 */
export function P8Steps() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const code = promo.custom;
  const room = useMemo(() => prepareRoom(PROMO_ROOMS[0], PROMO_ROOM.w), []);

  const lineP = progress(frame, 0, t.b(0.75), ease.out);
  const flat = progress(frame, t.s(1), t.b(1), ease.inOut);
  const d = threadLine(flat);
  const stepsOut = progress(frame, t.b(6), t.e(1), ease.inOut);

  const sketch = pencil(progress(frame, t.b(1), t.b(1), ease.out));
  const marks = pencil(progress(frame, t.b(2), t.e(1), ease.out));
  // Approval: a stamp-like badge pops in (0 → 1.12 → 1), then its tick is drawn.
  const pop = progress(frame, t.b(3), t.e(1), ease.out);
  const badge = pop * (1 + 0.12 * Math.sin(Math.PI * pop));
  const tick = progress(frame, t.b(3) + t.s(1), t.s(1.5), ease.out);
  const head = progress(frame, t.b(4), t.b(0.75), ease.inOut);
  const headY = mix(BOX.y - 20, BOX.y + BOX.h + 20, head);
  const printed = Math.max(0, Math.min(BOX.h, headY - BOX.y));
  const clearMarks = 1 - progress(frame, t.b(4), t.e(1), ease.out);
  const envIn = progress(frame, t.b(5), t.e(1), ease.menuIn);
  const envOut = progress(frame, t.b(5.75), t.e(1), ease.in);
  const packed = progress(frame, t.b(5.25), t.s(1), ease.linear);

  // The end: the room drawn on the line, the work hung over the sofa (rises from its mask).
  const roomDrawn = progress(frame, t.b(6), t.b(1.25), ease.linear);
  const hung = { w: 520, h: 334, x: 960 - 260, y: 170 };

  const env = { w: 420, h: 280 };
  const envX = mix(-env.w - 40, 960 - env.w / 2, envIn) + envOut * (1920 / 2 + env.w);
  const envY = BOX.y + BOX.h / 2 - env.h / 2;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center" }}>
        <MaskRise from={t.e(1)} duration={t.b(1.5)} exit={{ from: t.b(6), duration: t.e(1) }} innerStyle={{ paddingBottom: 10 }}>
          <div style={{ ...display(type.promo.medium, 500, -0.04, 1), color: color.ink }}>{copy.promo.stepsTitle}</div>
        </MaskRise>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {lineP > 0 ? <path d={d} fill="none" stroke={color.ink} strokeWidth={stroke.promo} strokeLinecap="round" style={lineP < 1 ? evolvePath(lineP, d) : undefined} /> : null}
        {BEADS.map((x, i) => {
          const shown = progress(frame, t.s(1) + (x / 1920) * t.b(0.6), t.s(1), ease.out);
          const lit = progress(frame, t.b(1 + i), t.e(1), ease.out);
          const pop = 1 + 0.4 * lit + 0.25 * Math.sin(Math.PI * progress(frame, t.b(1 + i), t.e(1), ease.linear));
          if (shown <= 0) return null;
          return (
            <circle
              key={x}
              cx={x}
              cy={LINE_Y}
              r={7 * shown * pop * (1 - stepsOut)}
              fill={lit > 0.5 ? color.accent : color.ink}
            />
          );
        })}
      </svg>

      {STEPS.map((s, i) => (
        <div key={s.n} style={{ position: "absolute", left: BEADS[i] - 150, width: 300, top: LINE_Y + 28, textAlign: "center", opacity: 1 - stepsOut }}>
          <MaskRise from={t.b(1 + i)} duration={t.b(1)}>
            <div style={{ ...tabular, fontSize: 26, fontWeight: 600, color: color.accent }}>{s.n.padStart(2, "0")}</div>
          </MaskRise>
          <MaskRise from={t.b(1 + i) + t.s(1)} duration={t.b(1)}>
            <div style={{ ...label(type.promo.label + 6), color: color.ink, marginTop: 6 }}>{s.t}</div>
          </MaskRise>
        </div>
      ))}

      {/* 1–4: sketch, crop marks and size, approval, the print pass. */}
      {packed < 1 ? (
        <>
          <LineDrawing art={archesSketch(BOX.w, BOX.h)} progress={sketch} x={BOX.x} y={BOX.y} opacity={1 - head} {...LINE} />
          <LineDrawing art={cropMarks(BOX.w, BOX.h)} progress={marks} x={BOX.x} y={BOX.y} opacity={clearMarks} {...LINE} />
          {marks > 0 ? (
            <div style={{ position: "absolute", left: BOX.x, width: BOX.w, top: BOX.y + BOX.h + 24, textAlign: "center", opacity: marks * clearMarks }}>
              <div style={{ ...label(type.promo.label), color: color.ink3 }}>{copy.reels.sketchSize}</div>
            </div>
          ) : null}
          {badge > 0 ? (
            <div
              style={{
                position: "absolute",
                left: BOX.x + BOX.w - 58,
                top: BOX.y - 52,
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: color.accent,
                scale: String(badge),
                opacity: clearMarks,
                boxShadow: "0 16px 30px -14px rgba(21,21,21,.4)",
              }}
            >
              <svg width={110} height={110} viewBox="0 0 110 110" style={{ opacity: tick > 0 ? 1 : 0 }}>
                <path
                  d="M33 57L48 72L78 40"
                  fill="none"
                  stroke={color.paperRaised}
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={`${tick} 1`}
                />
              </svg>
            </div>
          ) : null}
          <div style={{ position: "absolute", left: BOX.x, top: BOX.y, width: BOX.w, height: printed, overflow: "hidden", opacity: 1 - packed }}>
            <ArtImage code={code} width={BOX.w} height={BOX.h} shadow={head >= 1} />
          </div>
          {head > 0 && head < 1 ? (
            <div style={{ position: "absolute", left: BOX.x - 60, top: headY - 8, width: BOX.w + 120, height: 16, background: color.ink, borderRadius: 4 }}>
              <div style={{ position: "absolute", left: 10, right: 10, top: 4, height: 2, background: color.paperRaised, opacity: 0.6 }} />
            </div>
          ) : null}
        </>
      ) : null}

      {/* 5: the kraft envelope slides in, takes the work and leaves. */}
      {envIn > 0 && envOut < 1 ? (
        <div style={{ position: "absolute", left: envX, top: envY, width: env.w, height: env.h, background: color.paper2, borderRadius: 8, boxShadow: "0 24px 48px -24px rgba(21,21,21,.35)" }}>
          <LineDrawing art={envelope(env.w, env.h)} progress={1} x={0} y={0} {...LINE} />
          {envelopeSquares(env.w, env.h).map((q, i) => (
            <div key={i} style={{ position: "absolute", left: q.x, top: q.y, width: q.size, height: q.size, background: color.logoWave }} />
          ))}
        </div>
      ) : null}

      {/* The end: a room on the line, the work over the sofa. */}
      {roomDrawn > 0 ? (
        <>
          <svg width={PROMO_ROOM.w} height={PROMO_ROOM.h} style={{ position: "absolute", left: ROOM_X, top: LINE_Y - PROMO_ROOM.floor, overflow: "visible" }}>
            <RoomStrokes room={room} drawn={roomDrawn} beat={frame / t.b(1)} line={LINE} fine={FINE} />
          </svg>
          <FadeRise from={t.b(6.25)} duration={t.b(1.25)} style={{ position: "absolute", left: hung.x, top: hung.y }}>
            <ArtImage code={code} width={hung.w} height={hung.h} shadow />
          </FadeRise>
        </>
      ) : null}
    </AbsoluteFill>
  );
}
