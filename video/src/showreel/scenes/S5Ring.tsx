import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArtImage } from "../../primitives/ArtImage";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { CX, CY, palette } from "../layout";

const CODES = ["KZ-001", "KZ-121", "KZ-047", "KZ-113", "KZ-134", "KZ-070", "KZ-089", "KZ-024"];
const CARD = 360;
const RADIUS = 600;
const PERSPECTIVE = 1700;
/** On-screen scale of the front card (nearest point of the ring). */
const FRONT = PERSPECTIVE / (PERSPECTIVE - RADIUS);
export const S5_BG = palette["KZ-099"].deep;

/**
 * S5 (beats 13–17): eight works on a ring in 3D, seen slightly from above; the ring snaps round by one card on
 * every beat with a springy overshoot, then folds into the centre for the wall. Frames relative to S5.
 */
export function S5Ring() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTiming();
  const B = t.b(1);
  // Turn: one step per beat; each step is a spring from the beat.
  const beats = Math.floor(frame / B);
  const s = spring({ frame: frame - beats * B, fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
  const turn = -(beats + s) * (360 / CODES.length);
  const enter = progress(frame, 0, t.e(1) + t.s(1), ease.out);
  const fold = progress(frame, t.b(3) + t.e(1), t.e(1), ease.in);
  const r = RADIUS * mix(0.2, 1, enter) * (1 - fold);
  const tilt = mix(-24, -10, enter);

  return (
    <AbsoluteFill style={{ background: S5_BG }}>
      <div style={{ position: "absolute", left: CX, top: CY, perspective: PERSPECTIVE, perspectiveOrigin: "0 0" }}>
        <div style={{ transformStyle: "preserve-3d", transform: `rotateX(${tilt}deg) rotateY(${turn}deg)` }}>
          {CODES.map((code, i) => {
            const a = (i * 360) / CODES.length;
            return (
              <div
                key={code}
                style={{
                  position: "absolute",
                  left: -CARD / 2,
                  top: -CARD / 2,
                  width: CARD,
                  height: CARD,
                  transform: `rotateY(${a}deg) translateZ(${r}px) scale(${1 - 0.6 * fold})`,
                  backfaceVisibility: "hidden",
                }}
              >
                <ArtImage code={code} width={CARD} height={CARD} parentScale={FRONT} shadow />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
