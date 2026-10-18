import { useCurrentFrame } from "remotion";
import { promo } from "../../data/selection";
import { ribbonSpeed, WaveRibbon } from "../../effects/WaveRibbon";
import { ease, mix, progress } from "../../theme/easing";
import { useTiming, type Timing } from "../../theme/timing";
import { ARCH } from "../../lines/promo";
import { sceneStarts } from "../layout";

/** Speed multiplier of the titles: ×1, jerked to ×6 at +1.5b (ease-in, ½b), back to ×1 from +2.75b to +3.5b. */
function speedAt(f: number, P4: number, t: Timing) {
  const up = progress(f, P4 + t.b(1.5), t.e(1), ease.in);
  const down = progress(f, P4 + t.b(2.75), t.b(0.75), ease.inOut);
  return mix(1, 6, up * (1 - down));
}

/**
 * P4 (bar 9): the site's ribbon slides in from the right along its sine (¾b, ease-out) with the titles of the works
 * running at the site's speed; at +1.5b it is jerked to ×6 and the camera whips after it (ActWorld); from +3b it
 * slows and winds itself into a thin accent ring — the circle P5 opens in. Screen space, absolute frames.
 */
export function P4Ribbon() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const S = sceneStarts(t);
  if (frame < S.P4 || frame >= S.P5) return null;
  // Text offset: the speed summed frame by frame from the start of the scene (deterministic, any fps).
  const v = ribbonSpeed(1920) * (60 / t.fps);
  let offset = 0;
  for (let f = S.P4; f < frame; f++) offset -= v * speedAt(f, S.P4, t);
  const enter = 1 - progress(frame, S.P4, t.b(0.75), ease.out);
  const coil = progress(frame, S.P4 + t.b(2.9), t.b(1.1), ease.inOut);
  return (
    <div style={{ position: "absolute", inset: 0, translate: `${enter * 1920 * 1.25}px 0` }}>
      <WaveRibbon titles={promo.ribbonTitles} width={1920} cy={540} offset={offset} coil={{ t: coil, cx: ARCH.cx, cy: ARCH.cy, r: ARCH.circleR }} />
    </div>
  );
}
