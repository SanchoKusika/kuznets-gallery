import { AbsoluteFill, Sequence } from "remotion";
import { copy } from "../../data/copy";
import { AvatarOutro, CollapseToDot } from "../../effects/AvatarOutro";
import { LogoBuild, logoSchedule } from "../../effects/LogoBuild";
import { Pill } from "../../primitives/Chip";
import { FadeRise } from "../../primitives/MaskRise";
import { label, text } from "../../theme/fonts";
import { useTiming } from "../../theme/timing";
import { color } from "../../theme/tokens";
import { LOGO, LOGO_GEOMETRY, LOOP_DOT } from "../layout";
import { R8EdgeToWave } from "./R8EdgeToWave";

// R8 (bars 10–12, brief 7): canvas edge → wave, the logo builds, CTA, the avatar opens from the orange dot,
// then everything collapses into the dot, which leaves past the left edge — R1 brings it back from the right.

/** CTA under the logo — the layout of the approved styleframe (SfReelsLogo, frame 1570). */
function Cta() {
  const t = useTiming();
  const c = copy.reels;
  const center = { position: "absolute", left: 65, right: 65, textAlign: "center", color: color.ink } as const;
  return (
    <>
      <FadeRise from={t.b(5)} duration={t.b(1)} style={{ ...center, top: 905 }}>
        <div style={text(30)}>{c.ctaLine1}</div>
      </FadeRise>
      <FadeRise from={t.b(5.5)} duration={t.b(1)} style={{ ...center, top: 950 }}>
        <div style={text(30)}>{c.ctaLine2}</div>
      </FadeRise>
      <FadeRise from={t.b(6)} duration={t.b(1)} style={{ ...center, top: 1012 }}>
        <Pill>{c.ctaButton}</Pill>
      </FadeRise>
      <FadeRise from={t.b(6.25)} duration={t.b(1)} style={{ ...center, top: 1116 }}>
        <div style={{ ...label(26), color: color.ink2 }}>{c.ctaSite}</div>
      </FadeRise>
    </>
  );
}

/** R8: the logo, the avatar and the loop. Frames relative to the act (bar 9, 3 bars). */
export function ActLogo() {
  const t = useTiming();
  const g = LOGO_GEOMETRY;
  const last = t.bar(3) - 1;
  const exitFrom = t.b(11.75);
  return (
    <AbsoluteFill>
      <CollapseToDot
        dot={g.dot}
        collapse={{ from: t.b(11), duration: t.b(0.75) }}
        // Ends exactly on the act's last frame, so the dot is fully past the left edge there (loop seam).
        exit={{ from: exitFrom, duration: last - exitFrom }}
        exitColor={color.accent}
        exitSize={LOOP_DOT}
      >
        <AvatarOutro origin={{ x: g.dot.cx, y: g.dot.cy }} reveal={{ from: t.b(8), duration: t.b(1) }} lattice={{ from: t.b(8.5), duration: t.b(1.5) }} />
        <Sequence name="R8 холст → волна" durationInFrames={t.b(1.5)} layout="none">
          <R8EdgeToWave />
        </Sequence>
        <LogoBuild {...LOGO} schedule={logoSchedule.reels(t)} />
        <Cta />
      </CollapseToDot>
    </AbsoluteFill>
  );
}
