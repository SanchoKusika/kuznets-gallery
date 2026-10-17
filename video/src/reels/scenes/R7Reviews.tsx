import { AbsoluteFill, useCurrentFrame } from "remotion";
import { reels } from "../../data/selection";
import { Canvas3D } from "../../effects/Canvas3D";
import { ReviewStack } from "../../effects/ReviewStack";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { CANVAS_HANDOFF, CUSTOM } from "../layout";

/** Reviews: the box (centred in the safe zone) and where each one rests while it is the newest. */
const REVIEWS = { x: 90, width: 900, first: 330, second: 583, lift: 50 };

/**
 * R7 (bars 8–9): «Три арки» cuts from the flat picture to the 3D canvas, drops to its place under the reviews
 * (a menu-in rush on the downbeat) and slowly turns to −28° with a sway; bar 9 is the build-up — a slow push in.
 * Reviews: Max Nam on +¼b, Максим и Алеся on +4b (the first moves up and dims); both leave on the last beat.
 * On the last frame the canvas is at rest exactly at CANVAS_HANDOFF (R8 starts from it).
 */
export function R7Reviews() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const last = t.bar(2) - 1;
  const end = CANVAS_HANDOFF;

  const drop = progress(frame, 0, t.b(1.5), ease.menuIn);
  const turn = progress(frame, 0, t.b(3.5), ease.inOut);
  // Sway in from rest, gone again over the last beat, so both the cut and the hand-off are still.
  const swayEnv = progress(frame, 0, t.b(2), ease.out) * (1 - progress(frame, last - t.b(1.5), t.b(1.5), ease.inOut));
  const sway = Math.sin((2 * Math.PI * frame) / t.b(3)) * swayEnv;
  const tilt = Math.sin((2 * Math.PI * frame) / t.b(4)) * swayEnv;
  // Bar 9: the push in (≤ +10%, brief 5.4) that comes to rest on the last frame.
  const push = progress(frame, t.bar(1), last - t.bar(1), ease.inOut);

  const x = mix(CUSTOM.cx, end.x, drop);
  const y = mix(CUSTOM.cy, end.y, drop);
  const rotY = end.rotY * turn + 2.5 * sway;
  const rotX = end.rotX * turn + 1.5 * tilt;
  const scale = mix(1, end.scale, push);

  return (
    <AbsoluteFill>
      <Canvas3D
        code={reels.custom}
        faceWidth={CUSTOM.w}
        faceHeight={CUSTOM.h}
        x={x}
        y={y}
        rotY={rotY}
        rotX={rotX}
        scale={scale}
        shadow={progress(frame, 0, t.b(1.5), ease.out)}
      />
      <ReviewStack
        align="center"
        items={[
          { name: reels.reviews[0], at: t.s(1), x: REVIEWS.x, width: REVIEWS.width, y: REVIEWS.first },
          { name: reels.reviews[1], at: t.b(4), x: REVIEWS.x, width: REVIEWS.width, y: REVIEWS.second, lift: REVIEWS.lift },
        ]}
        exit={{ from: last + 1 - t.b(1), duration: t.e(1), stagger: t.s(1) }}
      />
    </AbsoluteFill>
  );
}
