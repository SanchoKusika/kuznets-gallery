import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ALLOWED, WORKS_COUNT } from "../../data/art";
import { ArtImage } from "../../primitives/ArtImage";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";
import { caps, CX, CY, lower } from "../layout";

const CARD = 250;
const GAP = 14;
const COLS = 4;
const X0 = (1080 - (COLS * CARD + (COLS - 1) * GAP)) / 2;
const PITCH = CARD + GAP;
/** Px per frame at 60 fps: neighbours run opposite ways. */
const SPEED = [3.2, -4.4, 3.8, -3.4];
const PER_COL = 14;
/** A fixed shuffle of the allowed works wide enough for a square card. */
const POOL = ALLOWED.filter((a) => Math.min(a.w, a.h) >= CARD / 1.1).map((a) => a.code).sort((a, b) => random(`s6-${a}`) - random(`s6-${b}`));

/**
 * S6 (beats 17–21): an endless wall — four columns of works running up and down past each other — under a giant
 * «159», cut out of the wall by difference blending, and «работ»; then the wall pulls back and tilts away.
 * Frames relative to S6.
 */
export function S6Wall() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTiming();
  const enter = progress(frame, 0, t.e(1) + t.s(1), ease.out);
  const numPop = spring({ frame: frame - t.s(1), fps, config: { damping: 10, stiffness: 160, mass: 0.7 } });
  const wordPop = spring({ frame: frame - t.b(1), fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  const pull = progress(frame, t.b(2) + t.e(1), t.b(1), ease.inOut);
  const leave = progress(frame, t.b(3) + t.e(1), t.e(1), ease.in);
  const z = mix(1, 0.62, pull) * (1 - 0.4 * leave);
  const tilt = mix(0, -11, pull);
  // Distance run so far, in seconds of base speed: the pull speeds the columns up 3.5× (summed frame by frame, so
  // the speed change never makes the wall jump).
  let run = 0;
  for (let f = 0; f < frame; f++) run += (1 + 2.5 * progress(f, t.b(2) + t.e(1), t.b(1), ease.inOut)) / fps;

  return (
    <AbsoluteFill style={{ background: bold.ink }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${tilt}deg) scale(${z})`, opacity: 1 - leave }}>
        {SPEED.map((v, c) => {
          // Whole cards run so far (they carry their works along) and the remainder within one card.
          const dist = v * 60 * run;
          const k = Math.floor(dist / PITCH);
          const offset = dist - k * PITCH;
          const intro = (1 - enter) * (c % 2 ? 1400 : -1400);
          return Array.from({ length: PER_COL }, (_, i) => {
            const n = POOL.length;
            const code = POOL[(((c * 37 + i - k) % n) + n) % n];
            const y = -PITCH * 4 + i * PITCH + offset + intro;
            return (
              <div key={`${c}-${i}`} style={{ position: "absolute", left: X0 + c * PITCH, top: y, width: CARD, height: CARD }}>
                <ArtImage code={code} width={CARD} height={CARD} parentScale={z} />
              </div>
            );
          });
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: CY - 330, display: "flex", flexDirection: "column", alignItems: "center", mixBlendMode: "difference", opacity: 1 - leave }}>
        <div style={{ ...caps(520, "#FFFFFF"), fontVariantNumeric: "tabular-nums", scale: String(numPop * (1 + 0.5 * leave)) }}>{WORKS_COUNT}</div>
        <div style={{ ...lower(170, "#FFFFFF"), marginTop: 10, scale: String(wordPop) }}>работ</div>
      </div>
    </AbsoluteFill>
  );
}
