import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { usePendulum } from "../../effects/Pendulum";
import { ArtFrame } from "../../primitives/ArtFrame";
import { ArtImage } from "../../primitives/ArtImage";
import { LinePath } from "../../primitives/LinePath";
import { Nail } from "../../primitives/PictureWire";
import { ease, mix, progress } from "../../theme/easing";
import type { Timing } from "../../theme/timing";
import { useTiming } from "../../theme/timing";
import { color, shadow, stroke } from "../../theme/tokens";
import { reels } from "../../data/selection";
import { LOGO_GEOMETRY, LOOP_DOT, NAIL } from "../layout";
import { actTimes, apexOrigin, dropAt, dropStartTop, frameSizeAt, hangingWire, hangSchedule, hungRect, SWING_FROM, type Hung, type Rect } from "./hanging";
import { R1Hook } from "./R1Hook";
import { WorkChip } from "./R2TryOn";
import { R3Interiors } from "./R3Interiors";

/** How far the act runs into R4: the frame and the interior fade out under the opening circle (brief R4 +0: 6 frames). */
export const ACT_FRAME_TAIL = (t: Timing) => t.s(1);

const WIRE = { color: color.ink2, width: stroke.reels * 0.8 };

/**
 * R1: the accent dot flies in from beyond the right edge on a sine (it left R8 through the left edge at the logo dot's
 * height, so the loop reads as one motion), lands on the nail point and shrinks into the nail head.
 */
function DotToNail() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = useTiming();
  const T = actTimes(t);
  const q = progress(frame, 0, T.dotArrive, ease.out);
  if (q >= 1) {
    const n = progress(frame, T.nail.from, T.nail.duration, ease.out);
    return <Nail x={NAIL.x} y={NAIL.y} head={mix(LOOP_DOT, 18, n)} shadow={n} />;
  }
  const x0 = width + LOOP_DOT / 2;
  const y0 = LOGO_GEOMETRY.dot.cy;
  // Full 40 px swing while it travels, damped to zero on the nail.
  const env = 1 - Math.max(0, Math.min(1, (q - 0.55) / 0.45)) ** 2;
  const x = mix(x0, NAIL.x, q);
  const y = mix(y0, NAIL.y, q) + 40 * Math.sin(2 * Math.PI * 1.25 * q) * env;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <circle cx={x} cy={y} r={LOOP_DOT / 2} fill={color.accent} />
    </svg>
  );
}

/** Works inside the frame: each in its own box, centred; the new one rises from the frame's bottom edge. */
function Works({ items, rect }: { items: Hung[]; rect: Rect }) {
  const frame = useCurrentFrame();
  let i = 0;
  while (i + 1 < items.length && frame >= items[i + 1].at) i++;
  const p = progress(frame, items[i].at, items[i].rise, ease.rise);
  const layers = p < 1 && i > 0 ? [i - 1, i] : [i];
  return (
    <>
      {layers.map((k) => {
        const { w, h } = items[k].size;
        return (
          <div key={k} style={{ position: "absolute", left: (rect.w - w) / 2, top: k === i ? (1 - p) * rect.h : 0 }}>
            <ArtImage code={items[k].code} width={w} height={h} />
          </div>
        );
      })}
    </>
  );
}

/**
 * One canvas at its own final size, hung from the nail. `rise` clips the work to the box and lifts it from the box's
 * bottom edge (the box is invisible until the work fills it); the shadow sits on an unclipped sibling and fades in
 * with the rise.
 */
function Canvas({ code, rect, angle, rise = 1, opacity = 1 }: { code: string; rect: Rect; angle: number; rise?: number; opacity?: number }) {
  const turn = { rotate: `${angle}deg`, transformOrigin: `${apexOrigin(rect).x}px ${apexOrigin(rect).y}px` };
  const box = { position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, ...turn } as const;
  return (
    <div style={{ opacity }}>
      <div style={{ ...box, boxShadow: shadow.float(Math.max(rect.w, rect.h) / 600), opacity: rise }} />
      <div style={{ ...box, overflow: "hidden" }}>
        <div style={{ translate: `0 ${(1 - rise) * 100}%` }}>
          <ArtImage code={code} width={rect.w} height={rect.h} />
        </div>
      </div>
    </div>
  );
}

/**
 * R3 changes: no shared frame between two proportions (neither work could cover the in-between box within 1.1×).
 * The new canvas rises inside its own final box over the old one, which fades out over the same beat.
 */
function RoomCanvases({ angle }: { angle: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const T = actTimes(t);
  let k = 0;
  T.changes.forEach((at, i) => {
    if (frame >= at) k = i + 1;
  });
  const rooms = reels.interiors;
  const p = progress(frame, T.changes[k - 1], T.change, ease.rise);
  const fade = progress(frame, T.changes[k - 1], T.change, ease.inOut);
  return (
    <>
      {p < 1 ? <Canvas code={rooms[k - 1].code} rect={hungRect(rooms[k - 1].frame)} angle={angle} opacity={1 - fade} /> : null}
      <Canvas code={rooms[k].code} rect={hungRect(rooms[k].frame)} angle={angle} rise={p} />
    </>
  );
}

/** Wire, canvas and nail from R1 +3b to the end of R3. */
function HangingFrame() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const T = actTimes(t);
  const swing = usePendulum(T.r2, SWING_FROM);
  const size = frameSizeAt(frame, t);
  const items = hangSchedule(t);

  const wireP = progress(frame, T.wire.from, T.wire.duration, ease.out);
  if (wireP <= 0) return null;
  const dropping = frame < T.r2;
  const drop = dropping ? dropAt(frame, t, size.h) : null;
  const rect = hungRect(size, drop ? drop.top : undefined);
  const angle = drop ? drop.angle : swing;
  const showFrame = frame >= T.drop.from;

  // Before the drop the canvas is above the screen: its wire is drawn from both top corners down to the nail.
  const corners = hungRect(size, dropStartTop(size.h));
  const wire =
    wireP < 1 && !showFrame ? (
      <>
        <LinePath d={`M${corners.x} ${corners.y}L${NAIL.x} ${NAIL.y}`} progress={wireP} {...WIRE} />
        <LinePath d={`M${corners.x + corners.w} ${corners.y}L${NAIL.x} ${NAIL.y}`} progress={wireP} {...WIRE} />
      </>
    ) : (
      <LinePath d={hangingWire(NAIL, rect, angle)} {...WIRE} />
    );

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {wire}
      </svg>
      {showFrame && frame < T.changes[0] ? (
        <ArtFrame x={rect.x} y={rect.y} w={rect.w} h={rect.h} rotate={angle} origin={apexOrigin(rect)}>
          <Works items={items} rect={rect} />
        </ArtFrame>
      ) : null}
      {frame >= T.changes[0] ? <RoomCanvases angle={angle} /> : null}
    </>
  );
}

/**
 * R1–R3 (brief 7): the dot becomes a nail, the canvas drops onto it and swings while the works change (R2), then the
 * interiors are drawn under it and the frame takes each one's proportions (R3). The camera jolts 20 px on every R3
 * change; at R4 +0 everything fades out under R4's opening circle.
 */
export function ActFrame() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const T = actTimes(t);
  // Camera: a 20 px jolt on the change (menu-in, ½b), then a slow drift back over the pause, so every interior
  // settles where the layout (and the styleframe) put it.
  const jolt = T.changes.reduce(
    (y, at) => y - 20 * (progress(frame, at, t.e(1), ease.menuIn) - progress(frame, at + t.e(1), t.b(1), ease.inOut)),
    0,
  );
  const fade = 1 - progress(frame, T.r4, t.b(1 / 6), ease.linear);
  return (
    <AbsoluteFill style={{ translate: `0 ${jolt}px`, opacity: fade }}>
      <Sequence name="R3 интерьеры" from={T.r3} layout="none">
        <R3Interiors />
      </Sequence>
      {/* The canvas falls in front of the hook. */}
      <Sequence name="R1 хук" durationInFrames={T.hook.exit + t.b(1)} layout="none">
        <R1Hook />
      </Sequence>
      <HangingFrame />
      <DotToNail />
      <WorkChip />
    </AbsoluteFill>
  );
}
