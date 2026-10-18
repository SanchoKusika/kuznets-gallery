import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { copy } from "../../data/copy";
import { CLIENTS } from "../../data/site";
import { LogoBuild, logoSchedule } from "../../effects/LogoBuild";
import { Curtains } from "../../primitives/Curtains";
import { FadeRise } from "../../primitives/MaskRise";
import { fonts, label, tabular, text } from "../../theme/fonts";
import { ease, progress } from "../../theme/easing";
import { useTiming } from "../../theme/timing";
import { color, type } from "../../theme/tokens";

/** The logo of the end (brief P10: ≈ 720 wide), a little above the middle to leave room for the stats and contacts. */
const LOGO = { width: 720, x: 960, y: 420 };

/** The four numbers of the site's hero, step 6 frames (60 fps), from P11 +1b. */
function Stats({ from }: { from: number }) {
  const t = useTiming();
  const step = Math.round((6 * t.fps) / 60);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center", gap: 120 }}>
      {copy.promo.stats.map(([value, caption], i) => (
        <FadeRise key={caption} from={from + i * step} duration={t.b(1)} style={{ textAlign: "center" }}>
          <div style={{ ...tabular, fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em", color: color.ink, whiteSpace: "nowrap" }}>{value}</div>
          <div style={{ ...text(18), color: color.ink3, marginTop: 6 }}>{caption}</div>
        </FadeRise>
      ))}
    </div>
  );
}

/** «нам доверяют 42 компании» and the clients running along the bottom (1 px a frame at 60 fps). */
function Clients({ from }: { from: number }) {
  const frame = useCurrentFrame();
  const t = useTiming();
  const line = copy.promo.clientsLine(copy.promo.clientsCount);
  const names = CLIENTS.join("  ·  ");
  const run = ((frame - from) * 60) / t.fps;
  return (
    <>
      <FadeRise from={from} duration={t.b(1)} style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center" }}>
        <div style={{ ...text(type.promo.text), color: color.ink2 }}>
          {line.before}
          <span style={{ color: color.accent, fontWeight: 600 }}>{line.number}</span>
          {line.after}
        </div>
      </FadeRise>
      <div style={{ position: "absolute", left: 0, right: 0, top: 930, overflow: "hidden", opacity: progress(frame, from + t.e(1), t.b(1), ease.out) }}>
        <div style={{ ...label(type.promo.label), color: color.ink4, whiteSpace: "nowrap", translate: `${-run}px 0` }}>
          {names}
          {"  ·  "}
          {names}
        </div>
      </div>
    </>
  );
}

/**
 * P10–P11 (bars 18–20): curtains ink → accent → paper (1b, menu-in, motion blur) leave a clean sheet; the logo builds
 * (wave, three beads, letters); on P11's downbeat the dot pops and GALLERY closes in; the numbers, the contacts and
 * the clients come in under it; at P11 +6b the dot breathes once and the frame holds. Frames relative to P10.
 */
export function P10Final() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const p11 = t.bar(1);
  const curtains = frame < t.b(1) + 2;
  return (
    <AbsoluteFill>
      {curtains ? (
        <CameraMotionBlur shutterAngle={180} samples={8}>
          <Curtains from={0} duration={t.b(1)} />
        </CameraMotionBlur>
      ) : (
        <AbsoluteFill style={{ backgroundColor: color.paper }} />
      )}
      <LogoBuild {...LOGO} schedule={logoSchedule.promo(t)} />
      <Stats from={p11 + t.b(1)} />
      <FadeRise from={p11 + t.b(2)} duration={t.b(1)} style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center" }}>
        <div style={{ fontFamily: fonts.sans, fontSize: type.promo.text, color: color.ink, letterSpacing: "0.01em" }}>{copy.promo.contacts}</div>
      </FadeRise>
      <Clients from={p11 + t.b(3)} />
    </AbsoluteFill>
  );
}
