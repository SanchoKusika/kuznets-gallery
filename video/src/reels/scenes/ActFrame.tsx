import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { Nail, WireLine } from "../../primitives/PictureWire";
import { ease, mix, progress } from "../../theme/easing";
import type { Timing } from "../../theme/timing";
import { useTiming } from "../../theme/timing";
import { color, shadow } from "../../theme/tokens";
import { LOGO_GEOMETRY, LOOP_DOT, NAIL } from "../layout";
import { actTimes, APEX, canvasSlots, DEPTH, hangSchedule, PERSPECTIVE, poseAt, wireAt, type CanvasSlot, type Hung, type Size } from "./hanging";
import { R1Hook } from "./R1Hook";
import { WorkChip } from "./R2TryOn";
import { R3Interiors } from "./R3Interiors";

/** How far the act runs into R4: the frame and the interior fade out under the opening circle (brief R4 +0: 6 frames). */
export const ACT_FRAME_TAIL = (t: Timing) => t.s(1);

/**
 * R1: the accent dot the video ended with (it rests where the logo's dot was) hops onto the nail point — a swoop
 * down and up, starting from rest so the loop has no jolt — and shrinks into the nail head.
 */
function DotToNail() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const T = actTimes(t);
  const q = progress(frame, 0, T.dotArrive, ease.inOut);
  if (q >= 1) {
    const n = progress(frame, T.nail.from, T.nail.duration, ease.out);
    return <Nail x={NAIL.x} y={NAIL.y} head={mix(LOOP_DOT, 18, n)} shadow={n} />;
  }
  const from = LOGO_GEOMETRY.dot;
  const x = mix(from.cx, NAIL.x, q) + 70 * Math.sin(Math.PI * q);
  const y = mix(from.cy, NAIL.y, q) + 150 * Math.sin(Math.PI * q) * (1 - q * 0.4);
  // Squash along the path in the fast middle, round at both ends.
  const stretch = 1 + 0.18 * Math.sin(Math.PI * q) ** 2;
  const heading = Math.atan2(NAIL.y - from.cy - 150 * Math.PI * Math.cos(Math.PI * q), NAIL.x - from.cx + 70 * Math.PI * Math.cos(Math.PI * q));
  return (
    <div
      style={{
        position: "absolute",
        left: x - LOOP_DOT / 2,
        top: y - LOOP_DOT / 2,
        width: LOOP_DOT,
        height: LOOP_DOT,
        borderRadius: "50%",
        background: color.accent,
        transform: `rotate(${heading}rad) scale(${stretch}, ${1 / stretch})`,
      }}
    />
  );
}

/** Works rising in the square canvas: each new one rises from the bottom edge over the previous. */
function Works({ items, size }: { items: Hung[]; size: Size }) {
  const frame = useCurrentFrame();
  let i = 0;
  while (i + 1 < items.length && frame >= items[i + 1].at) i++;
  const p = progress(frame, items[i].at, items[i].rise, ease.rise);
  const layers = p < 1 && i > 0 ? [i - 1, i] : [i];
  return (
    <>
      {layers.map((k) => (
        <div key={k} style={{ position: "absolute", inset: 0, translate: k === i ? `0 ${(1 - p) * 100}%` : undefined }}>
          <ArtImage code={items[k].code} width={size.w} height={size.h} />
        </div>
      ))}
    </>
  );
}

/** One side of the stretcher: the picture's edge folded round it (gallery wrap), mirrored and in shade. */
function Side({ code, size, right }: { code: string; size: Size; right: boolean }) {
  const { w, h } = size;
  return (
    <div
      style={{
        position: "absolute",
        left: (right ? w : 0) - DEPTH / 2,
        top: 0,
        width: DEPTH,
        height: h,
        overflow: "hidden",
        transform: `rotateY(${right ? 90 : -90}deg)`,
        backfaceVisibility: "hidden",
        filter: "brightness(.72)",
      }}
    >
      <div style={{ position: "absolute", left: right ? DEPTH - w : 0, top: 0, scale: "-1 1", transformOrigin: right ? `${w - DEPTH / 2}px 0` : `${DEPTH / 2}px 0` }}>
        <ArtImage code={code} width={w} height={h} />
      </div>
    </div>
  );
}

/**
 * A canvas on the nail in CSS 3D (the act's perspective): turned about its apex by the pendulum and about the
 * vertical axis through the nail by the R3 spin; the face sits DEPTH / 2 in front of the wire's plane, the sides
 * show while it turns.
 */
function HungCanvas({ slot }: { slot: CanvasSlot }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const pose = poseAt(slot, frame, t);
  const { w, h } = slot.size;
  const items = hangSchedule(t);
  // The code on the sides: the work on top of the square (the one rising), or the slot's own.
  let top = 0;
  while (top + 1 < items.length && frame >= items[top + 1].at) top++;
  const code = slot.code ?? items[top].code;
  return (
    <div
      style={{
        position: "absolute",
        left: NAIL.x - w / 2,
        top: pose.top,
        width: w,
        height: h,
        transformStyle: "preserve-3d",
        transformOrigin: `${w / 2}px ${-APEX}px`,
        transform: `rotate(${pose.rotZ}deg) rotateY(${pose.rotY}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          transform: `translateZ(${DEPTH / 2}px)`,
          backfaceVisibility: "hidden",
          boxShadow: shadow.float(Math.max(w, h) / 600),
        }}
      >
        {slot.code ? <ArtImage code={slot.code} width={w} height={h} /> : <Works items={items} size={slot.size} />}
      </div>
      {Math.abs(pose.rotY) > 0.5 ? (
        <>
          <Side code={code} size={slot.size} right={false} />
          <Side code={code} size={slot.size} right />
        </>
      ) : null}
    </div>
  );
}

/** Wire, nail and canvas from the drop in R1 to the end of R3: the wire behind the nail's head, the canvas in front. */
function HangingFrame() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const slot = canvasSlots(t).find((s) => frame >= s.from && frame < s.to);
  const wire = slot ? wireAt(slot, frame, t) : null;
  return (
    <>
      {wire ? <WireLine points={wire} /> : null}
      <DotToNail />
      {slot ? (
        <AbsoluteFill style={{ perspective: PERSPECTIVE, perspectiveOrigin: `${NAIL.x}px ${NAIL.y}px` }}>
          <HungCanvas slot={slot} />
        </AbsoluteFill>
      ) : null}
    </>
  );
}

/**
 * R1–R3 (brief 7): the dot becomes a nail, the canvas falls onto it — its wire catches — and swings while the works
 * change (R2); then the interiors are drawn under it, and on every change the canvas spins round on the nail into the
 * next work in its own proportions (R3). The camera jolts 20 px on every R3 change; at R4 +0 everything fades out
 * under R4's opening circle.
 */
export function ActFrame() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const T = actTimes(t);
  // Camera: a 20 px jolt on the change (menu-in, ½b), then a slow drift back over the pause, so every interior
  // settles where the layout put it.
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
      <WorkChip />
    </AbsoluteFill>
  );
}
