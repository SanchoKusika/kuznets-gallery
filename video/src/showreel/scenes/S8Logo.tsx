import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CONTACTS } from "../../data/site";
import { LogoBuild, logoGeometry, type LogoSchedule } from "../../effects/LogoBuild";
import { MaskRise } from "../../primitives/MaskRise";
import { ease, mix, progress } from "../../theme/easing";
import { fonts } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { bold } from "../../theme/tokens";

const LOGO = { width: 900, x: 540, y: 860 } as const;
const G = logoGeometry(LOGO.width, LOGO.x, LOGO.y);

/**
 * S8 (beats 25–30), the end card on white: the logo builds part by part; when its dot pops, three accent rings
 * shock out of it; the site and the Instagram handle rise beneath. Frames relative to S8.
 */
export function S8Logo() {
  const frame = useCurrentFrame();
  const t = useTiming();
  const schedule: LogoSchedule = {
    wave: { from: 2, duration: t.e(1) },
    beads: [t.s(1) + 2, t.e(1) + 2, t.e(1) + t.s(1) + 2],
    letters: t.e(1),
    dot: t.b(1) + t.s(1),
    gallery: t.b(1) + t.s(1),
    breath: t.b(3),
  };
  const ringsFrom = (schedule.dot ?? 0) + 3;

  return (
    <AbsoluteFill style={{ background: bold.bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2].map((i) => {
          const p = progress(frame, ringsFrom + i * 5, t.b(1) + t.e(1), ease.out);
          if (p <= 0 || p >= 1) return null;
          return <circle key={i} cx={G.dot.cx} cy={G.dot.cy} r={mix(G.dot.r, 900, p)} fill="none" stroke={bold.accent} strokeWidth={mix(10, 1, p)} opacity={1 - p} />;
        })}
      </svg>
      <LogoBuild width={LOGO.width} x={LOGO.x} y={LOGO.y} schedule={schedule} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1120, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <MaskRise from={t.b(2)} duration={t.e(1)}>
          <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 84, letterSpacing: "-0.04em", color: bold.ink }}>kuznets.uz</div>
        </MaskRise>
        <MaskRise from={t.b(2) + t.s(1) + 2} duration={t.e(1)}>
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 40, letterSpacing: "-0.01em", color: bold.accent }}>{CONTACTS.instagram.handle}</div>
        </MaskRise>
      </div>
    </AbsoluteFill>
  );
}
